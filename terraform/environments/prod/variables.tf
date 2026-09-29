variable "aws_region" {
  description = "Region for the application stack. State can stay in us-east-1."
  type        = string
  default     = "us-east-1"
}

variable "name_prefix" {
  description = "Prefix for named resources."
  type        = string
  default     = "url-shortener"
}

variable "urls_table_name" {
  description = "DynamoDB table for short URLs."
  type        = string
  default     = "url-shortener"
}

variable "users_table_name" {
  description = "DynamoDB table for users."
  type        = string
  default     = "url-shortener-users"
}

variable "jwt_secret" {
  description = "JWT signing secret (at least 32 characters). Set with TF_VAR_jwt_secret."
  type        = string
  sensitive   = true
}

variable "lambda_zip_path" {
  description = "Zip built by npm run package:lambda in backend/."
  type        = string
  default     = "../../../backend/url-shortener-lambda.zip"
}
