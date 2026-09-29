terraform {
  backend "s3" {
    bucket         = "url-shortener-tfstate-prod78"
    key            = "url-shortener/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
