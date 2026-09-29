output "state_bucket_name" {
  description = "Set this as the prod backend bucket (and GitHub variable TF_STATE_BUCKET)."
  value       = aws_s3_bucket.tfstate.id
}

output "lock_table_name" {
  description = "DynamoDB lock table referenced by the prod backend."
  value       = aws_dynamodb_table.locks.name
}

output "aws_region" {
  description = "Region where the state bucket and lock table were created."
  value       = var.aws_region
}
