variable "name_prefix" {
  description = "Prefix for the Lambda function, IAM role, and HTTP API."
  type        = string
  default     = "url-shortener-78"
}

variable "lambda_zip_path" {
  description = "Path to the zip produced by backend/scripts/package-lambda.sh."
  type        = string
}

variable "jwt_secret" {
  description = "Signing secret for access tokens. At least 32 characters. Do not commit this value."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "jwt_secret must be at least 32 characters."
  }
}

variable "urls_table_name" {
  description = "DynamoDB table name stored in DYNAMODB_TABLE_NAME."
  type        = string
}

variable "users_table_name" {
  description = "DynamoDB table name stored in USERS_TABLE_NAME."
  type        = string
}

variable "dynamodb_resource_arns" {
  description = "Table and index ARNs the function may read and write."
  type        = list(string)
}

variable "frontend_url" {
  description = "Browser origin allowed by CORS. Typically the CloudFront URL."
  type        = string
}

variable "memory_size" {
  description = "Lambda memory in MB."
  type        = number
  default     = 256
}

variable "timeout" {
  description = "Lambda timeout in seconds."
  type        = number
  default     = 30
}
