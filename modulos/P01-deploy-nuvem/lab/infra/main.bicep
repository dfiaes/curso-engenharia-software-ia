// P01: um serviço com LLM no Azure Container Apps, sem chaves e sem segredo no código.
// Escopo: resource group. Valores de modelo/capacidade são exemplos: mudam por região e data.
targetScope = 'resourceGroup'

@description('Prefixo curto (3-12 minúsculas/dígitos) usado nos nomes.')
@minLength(3)
@maxLength(12)
param prefix string

param location string = resourceGroup().location

@description('Imagem completa com tag imutável (ex.: <acr>.azurecr.io/llm-service:<sha>). Vazio = só a base.')
param image string = ''

@description('Sufixo da revisão (use o SHA curto do commit): cada deploy gera uma revisão nomeada.')
param revisionSuffix string = 'r1'

@description('Revisão que mantém o tráfego estável durante o canário; vazio = 100% na última.')
param stableRevision string = ''

@minValue(1)
@maxValue(100)
param canaryPercent int = 100

param modelName string = 'gpt-4o-mini'
param modelVersion string = '2024-07-18'
param modelCapacity int = 10

@minValue(0)
param minReplicas int = 1
@minValue(1)
param maxReplicas int = 5

@description('true: expõe PARTNER_API_KEY a partir do Key Vault (o segredo precisa existir antes).')
param useKeyVaultSecret bool = false

@description('Orçamento mensal do resource group, na moeda da assinatura. 0 = não cria.')
param budgetAmount int = 0
param budgetAlertEmail string = ''
param budgetStart string = utcNow('yyyy-MM-01')

param tags object = { workload: 'p01-llm-service' }

var suffix = uniqueString(resourceGroup().id)
var acrName = '${prefix}acr${suffix}'
var kvName = '${prefix}-kv-${take(suffix, 6)}'
var oaiName = '${prefix}-oai-${suffix}'

// IDs de papéis internos do Azure (documentados em learn.microsoft.com, built-in roles).
var roleAcrPull = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
var roleKeyVaultSecretsUser = '4633458b-17de-408a-b874-0445c86b69e6'
var roleOpenAiUser = '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${prefix}-logs'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appi 'Microsoft.Insights/components@2020-02-02' = {
  name: '${prefix}-appi'
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logs.id
  }
}

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${prefix}-id'
  location: location
  tags: tags
}

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  tags: tags
  sku: { name: 'Basic' }
  properties: { adminUserEnabled: false }
}

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: kvName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: true
  }
}

resource oai 'Microsoft.CognitiveServices/accounts@2024-10-01' = {
  name: oaiName
  location: location
  kind: 'OpenAI'
  tags: tags
  sku: { name: 'S0' }
  properties: {
    customSubDomainName: oaiName
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: true
  }
}

resource model 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  parent: oai
  name: modelName
  sku: { name: 'GlobalStandard', capacity: modelCapacity }
  properties: {
    model: { format: 'OpenAI', name: modelName, version: modelVersion }
  }
}

resource env 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${prefix}-env'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: { destination: 'azure-monitor' }
    workloadProfiles: [
      { name: 'Consumption', workloadProfileType: 'Consumption' }
    ]
  }
}

resource envDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'to-log-analytics'
  scope: env
  properties: {
    workspaceId: logs.id
    logAnalyticsDestinationType: 'Dedicated'
    logs: [
      { category: 'ContainerAppConsoleLogs', enabled: true }
      { category: 'ContainerAppSystemLogs', enabled: true }
    ]
  }
}

// RBAC mínimo: a identidade só puxa imagem, lê segredos e chama o modelo. Nada de Contributor.
resource pullImages 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, identity.id, roleAcrPull)
  scope: acr
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleAcrPull)
  }
}

resource readSecrets 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(kv.id, identity.id, roleKeyVaultSecretsUser)
  scope: kv
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      roleKeyVaultSecretsUser
    )
  }
}

resource callModel 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(oai.id, identity.id, roleOpenAiUser)
  scope: oai
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleOpenAiUser)
  }
}

var baseEnv = [
  { name: 'APP_ENV', value: 'prod' }
  { name: 'LLM_BACKEND', value: 'azure' }
  { name: 'AZURE_OPENAI_ENDPOINT', value: oai.properties.endpoint }
  { name: 'AZURE_OPENAI_DEPLOYMENT', value: model.name }
  { name: 'AZURE_CLIENT_ID', value: identity.properties.clientId }
  { name: 'OTEL_SERVICE_NAME', value: 'llm-service' }
  { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appi.properties.ConnectionString }
]

var secretEnv = useKeyVaultSecret
  ? [
      {
        name: 'PARTNER_API_KEY'
        secretRef: 'partner-api-key'
      }
    ]
  : []

var appSecrets = useKeyVaultSecret
  ? [
      {
        name: 'partner-api-key'
        keyVaultUrl: '${kv.properties.vaultUri}secrets/partner-api-key'
        identity: identity.id
      }
    ]
  : []

var traffic = empty(stableRevision)
  ? [
      { latestRevision: true, weight: 100 }
    ]
  : [
      { revisionName: stableRevision, weight: 100 - canaryPercent }
      { latestRevision: true, weight: canaryPercent }
    ]

resource app 'Microsoft.App/containerApps@2024-03-01' = if (!empty(image)) {
  name: '${prefix}-app'
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    environmentId: env.id
    workloadProfileName: 'Consumption'
    configuration: {
      activeRevisionsMode: 'Multiple'
      ingress: {
        external: true
        targetPort: 8000
        transport: 'auto'
        traffic: traffic
      }
      registries: [
        { server: acr.properties.loginServer, identity: identity.id }
      ]
      secrets: appSecrets
    }
    template: {
      revisionSuffix: revisionSuffix
      containers: [
        {
          name: 'llm-service'
          image: image
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: concat(baseEnv, secretEnv)
          probes: [
            {
              type: 'Startup'
              httpGet: { path: '/healthz', port: 8000 }
              periodSeconds: 3
              failureThreshold: 20
            }
            {
              type: 'Liveness'
              httpGet: { path: '/healthz', port: 8000 }
              periodSeconds: 10
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: { path: '/readyz', port: 8000 }
              periodSeconds: 5
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-concurrency'
            http: { metadata: { concurrentRequests: '10' } }
          }
        ]
      }
    }
  }
  dependsOn: [
    pullImages
    readSecrets
    callModel
  ]
}

resource budget 'Microsoft.Consumption/budgets@2023-11-01' = if (budgetAmount > 0 && !empty(budgetAlertEmail)) {
  name: '${prefix}-budget'
  properties: {
    category: 'Cost'
    amount: budgetAmount
    timeGrain: 'Monthly'
    timePeriod: { startDate: budgetStart }
    notifications: {
      actual80: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 80
        thresholdType: 'Actual'
        contactEmails: [budgetAlertEmail]
      }
      forecast100: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 100
        thresholdType: 'Forecasted'
        contactEmails: [budgetAlertEmail]
      }
    }
  }
}

output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output keyVaultName string = kv.name
output identityClientId string = identity.properties.clientId
output openAiEndpoint string = oai.properties.endpoint
output appName string = '${prefix}-app'
output appFqdn string = app.?properties.configuration.ingress.fqdn ?? ''
