param(
    [Parameter(Mandatory=$true)]
    [string]$resourceGroupName,
    
    [string]$location = "westeurope",

    [string]$storageAccountName = "totalitecamapp",
    [string]$containerName = "`$web"
)

# Ensure Azure CLI is installed and user is logged in
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI is not installed. Please install it first."
    exit 1
}

# Check if logged in to Azure
$account = az account show | ConvertFrom-Json
if (!$account) {
    Write-Host "Please log in to Azure first using 'az login'"
    exit 1
}

# Create resource group if it doesn't exist
$rgExists = az group exists --name $resourceGroupName
if ($rgExists -eq "false") {
    Write-Host "Creating resource group '$resourceGroupName'..."
    az group create --name $resourceGroupName --location $location
}

# Create storage account if it doesn't exist
$storageAccount = az storage account show --name $storageAccountName --resource-group $resourceGroupName 2>$null | ConvertFrom-Json
if (!$storageAccount) {
    Write-Host "Creating storage account '$storageAccountName'..."
    az storage account create `
        --name $storageAccountName `
        --resource-group $resourceGroupName `
        --location $location `
        --sku Standard_LRS `
        --kind StorageV2
}

# Enable static website hosting
Write-Host "Enabling static website hosting..."
az storage blob service-properties update `
    --account-name $storageAccountName `
    --static-website `
    --index-document index.html `
    --404-document index.html

# Get storage account key
$accountKey = (az storage account keys list --resource-group $resourceGroupName --account-name $storageAccountName | ConvertFrom-Json)[0].value

# Upload contents of site folder
Write-Host "Uploading website content..."
az storage blob upload-batch `
    --account-name $storageAccountName `
    --account-key $accountKey `
    --destination "`$web" `
    --source "site" `
    --overwrite

# Get the website URL
$websiteUrl = (az storage account show `
    --name $storageAccountName `
    --resource-group $resourceGroupName `
    --query "primaryEndpoints.web" `
    --output tsv)

Write-Host "`nDeployment complete!"
Write-Host "Website URL: $websiteUrl" 