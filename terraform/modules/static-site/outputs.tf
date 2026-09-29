output "bucket_name" {
  value = aws_s3_bucket.site.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.site.domain_name
}

output "cloudfront_url" {
  description = "Origin passed to the Lambda FRONTEND_URL variable."
  value       = "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "distribution_id" {
  description = "Used by CI to invalidate the distribution after a frontend upload."
  value       = aws_cloudfront_distribution.site.id
}
