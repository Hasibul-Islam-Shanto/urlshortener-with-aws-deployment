output "api_invoke_url" {
  description = "Base URL for VITE_API_BASE_URL. No trailing slash."
  value       = trimsuffix(aws_apigatewayv2_stage.default.invoke_url, "/")
}

output "function_name" {
  value = aws_lambda_function.api.function_name
}

output "api_id" {
  value = aws_apigatewayv2_api.http.id
}
