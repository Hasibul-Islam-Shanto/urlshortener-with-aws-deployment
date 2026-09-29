# Infrastructure

Terraform creates a new stack in AWS. It does not import the Lambda, API Gateway, or CloudFront resources that were created by hand.

| Path | What it creates |
| --- | --- |
| `bootstrap/` | S3 bucket and DynamoDB table for Terraform state. Apply once from your laptop. |
| `environments/prod/` | DynamoDB, Lambda, HTTP API, and the S3/CloudFront site. |
| `modules/` | Those resources, wired by the prod root module. |

The default region is `us-east-1`. Local `.env` files can still point at another region.

## What prod creates

- **DynamoDB.** URLs table `url-shortener` with GSI `UserUrlsIndex` (`userId`, `createdAt`). Users table `url-shortener-users` with GSI `EmailIndex` (`email`). Billing is on-demand. Both tables set `prevent_destroy`.
- **Lambda.** Node.js 20, handler `dist/lambda/handler.handler`. The zip comes from `backend/scripts/package-lambda.sh`. Each apply updates the function when the zip hash changes.
- **HTTP API.** Payload format 2.0, `$default` stage, and the route keys in `backend/src/lambda/routes.ts`, plus `OPTIONS` for each path. CORS stays in the Lambda handler.
- **Static site.** Private S3 bucket, CloudFront with origin access control, and 403/404 responses rewritten to `200 /index.html`.

Lambda environment variables come from the modules:

| Variable | Source |
| --- | --- |
| `DYNAMODB_TABLE_NAME` | URLs table name |
| `USERS_TABLE_NAME` | Users table name |
| `JWT_SECRET` | `TF_VAR_jwt_secret` (never committed) |
| `FRONTEND_URL` | CloudFront URL |

Lambda sets `AWS_REGION` itself. That name is reserved, so Terraform does not pass it.

After apply, point the apps at the outputs:

```bash
cd terraform/environments/prod
terraform output -raw api_invoke_url    # frontend VITE_API_BASE_URL
terraform output -raw cloudfront_url    # public site
terraform output urls_table_name
terraform output users_table_name
```

## One-time setup

You need Terraform 1.5+ and AWS credentials that can create S3, DynamoDB, and IAM.

### 1. Remote state

```bash
cd terraform/bootstrap
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

Copy `state_bucket_name` into `terraform/environments/prod/backend.tf` (replace `url-shortener-tfstate-CHANGE-ME`). CI can leave that placeholder and pass `-backend-config="bucket=$TF_STATE_BUCKET"` instead. The lock table name stays `terraform-locks` unless you changed it.

### 2. GitHub repository settings

Create an IAM user that can manage this stack (S3, DynamoDB, Lambda, API Gateway, CloudFront, IAM roles for the function, and the Terraform state bucket). Put its keys in GitHub Actions secrets. Do not commit them.

| Name | Kind | Value |
| --- | --- | --- |
| `AWS_ACCESS_KEY_ID` | Secret | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | Secret | IAM user secret key |
| `TF_STATE_BUCKET` | Variable | State bucket from the bootstrap output |
| `TF_VAR_jwt_secret` | Secret | At least 32 characters. `openssl rand -base64 48` |

Optional: add required reviewers on the GitHub Environment named `production`. Apply and deploy jobs use that environment.

## Apply the application stack

Package the function first. Terraform reads `backend/url-shortener-lambda.zip`.

```bash
cd backend
npm ci
npm run package:lambda

cd ../terraform/environments/prod
cp terraform.tfvars.example terraform.tfvars
export TF_VAR_jwt_secret="$(openssl rand -base64 48)"
terraform init
terraform plan
terraform apply
```

Use the same `TF_VAR_jwt_secret` later. Changing it signs out every existing token. The value is stored in the remote state file, so the state bucket must stay private (the bootstrap stack blocks public access and encrypts the bucket).

Then set `frontend/.env`:

```env
VITE_API_BASE_URL=<api_invoke_url output>
```

For a local API against these tables, set `DYNAMODB_TABLE_NAME` and `USERS_TABLE_NAME` in `backend/.env` to the outputs. Keep `FRONTEND_URL=http://localhost:5173` for local CORS. Production Lambda uses the CloudFront origin instead.

## CI

| Workflow | When | What it does |
| --- | --- | --- |
| `terraform-plan.yml` | Pull request touching `terraform/**` or `backend/**` | Packages the Lambda zip, runs `terraform plan`, writes the plan to the job summary |
| `terraform-apply.yml` | Push to `main` touching `terraform/**` | `terraform apply` so AWS matches the repo |
| `deploy-backend.yml` | Push to `main` touching `backend/**` | Rebuilds the zip and applies, which publishes the new Lambda code |
| `deploy-frontend.yml` | Push to `main` touching `frontend/**` | Builds with `VITE_API_BASE_URL` from `api_invoke_url`, syncs `frontend/dist` to the site bucket, invalidates CloudFront |

Apply and deploy jobs share a lock group so they do not fight over the state file. The DynamoDB lock table is the second guard.

Day to day, change `.tf` files and merge to `main`. Do not edit the Lambda, API, tables, or CloudFront distribution in the console if you want the repo to stay the source of truth. The next apply would revert those edits.

## Destroy

DynamoDB tables refuse destroy until you delete the `prevent_destroy` lifecycle blocks in `terraform/modules/dynamodb/main.tf`. Empty the site bucket before destroying it. Destroy `environments/prod` before the bootstrap bucket if you still need the state file to run destroy.
