output "urls_table_name" {
  value = aws_dynamodb_table.urls.name
}

output "users_table_name" {
  value = aws_dynamodb_table.users.name
}

output "urls_table_arn" {
  value = aws_dynamodb_table.urls.arn
}

output "users_table_arn" {
  value = aws_dynamodb_table.users.arn
}

output "resource_arns" {
  description = "Table and GSI ARNs the Lambda role may access."
  value = [
    aws_dynamodb_table.urls.arn,
    "${aws_dynamodb_table.urls.arn}/index/UserUrlsIndex",
    aws_dynamodb_table.users.arn,
    "${aws_dynamodb_table.users.arn}/index/EmailIndex",
  ]
}
