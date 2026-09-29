output "api_invoke_url" {
  description = "Set as VITE_API_BASE_URL when building the frontend."
  value       = module.api_lambda.api_invoke_url
}

output "cloudfront_url" {
  description = "Public URL of the static site. Also the Lambda FRONTEND_URL origin."
  value       = module.static_site.cloudfront_url
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution to invalidate after a frontend upload."
  value       = module.static_site.distribution_id
}

output "site_bucket_name" {
  description = "S3 bucket that receives frontend/dist."
  value       = module.static_site.bucket_name
}

output "urls_table_name" {
  value = module.dynamodb.urls_table_name
}

output "users_table_name" {
  value = module.dynamodb.users_table_name
}

output "lambda_function_name" {
  value = module.api_lambda.function_name
}
