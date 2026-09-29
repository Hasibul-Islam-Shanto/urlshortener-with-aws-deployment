provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "url-shortener"
      ManagedBy = "terraform"
    }
  }
}

module "dynamodb" {
  source = "../../modules/dynamodb"

  urls_table_name  = var.urls_table_name
  users_table_name = var.users_table_name
}

module "static_site" {
  source = "../../modules/static-site"

  name_prefix = var.name_prefix
}

module "api_lambda" {
  source = "../../modules/api-lambda"

  name_prefix            = var.name_prefix
  lambda_zip_path        = var.lambda_zip_path
  jwt_secret             = var.jwt_secret
  urls_table_name        = module.dynamodb.urls_table_name
  users_table_name       = module.dynamodb.users_table_name
  dynamodb_resource_arns = module.dynamodb.resource_arns
  frontend_url           = module.static_site.cloudfront_url
}
