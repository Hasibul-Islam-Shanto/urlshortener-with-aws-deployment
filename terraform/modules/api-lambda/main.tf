locals {
  http_routes = toset([
    "POST /auth/signup",
    "POST /auth/signin",
    "GET /auth/me",
    "POST /urls",
    "GET /urls",
    "GET /urls/{shortCode}",
    "GET /{shortCode}",
    "DELETE /urls/{shortCode}",
  ])

  option_routes = toset([
    for route in local.http_routes : "OPTIONS ${split(" ", route)[1]}"
  ])

  routes = setunion(local.http_routes, local.option_routes)
}

data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.name_prefix}-lambda"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

resource "aws_iam_role_policy_attachment" "basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "dynamodb" {
  statement {
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:DeleteItem",
    ]
    resources = var.dynamodb_resource_arns
  }
}

resource "aws_iam_role_policy" "dynamodb" {
  name   = "${var.name_prefix}-dynamodb"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.dynamodb.json
}

resource "aws_lambda_function" "api" {
  function_name    = "${var.name_prefix}-api"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs20.x"
  handler          = "dist/lambda/handler.handler"
  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  memory_size      = var.memory_size
  timeout          = var.timeout

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = var.urls_table_name
      USERS_TABLE_NAME    = var.users_table_name
      JWT_SECRET          = var.jwt_secret
      FRONTEND_URL        = var.frontend_url
    }
  }

  lifecycle {
    precondition {
      condition     = fileexists(var.lambda_zip_path)
      error_message = "Lambda zip not found at ${var.lambda_zip_path}. From backend/, run npm run package:lambda."
    }
  }
}

resource "aws_apigatewayv2_api" "http" {
  name          = "${var.name_prefix}-http"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = local.routes

  api_id    = aws_apigatewayv2_api.http.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true

  depends_on = [aws_apigatewayv2_route.routes]
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
