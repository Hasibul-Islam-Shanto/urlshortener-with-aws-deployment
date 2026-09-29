variable "urls_table_name" {
  description = "DynamoDB table for short URLs. Partition key is shortCode."
  type        = string
  default     = "url-shortener"
}

variable "users_table_name" {
  description = "DynamoDB table for users. Partition key is userId."
  type        = string
  default     = "url-shortener-users"
}
