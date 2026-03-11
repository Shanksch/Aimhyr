# Python Backend Deployment Guide

Complete step-by-step instructions for deploying your FastAPI backend to production.

## 🚀 Deployment Options

### 1. Railway.app (⭐ Recommended - Easiest)

**Why Railway?** - Simple Git-based deployment, generous free tier, excellent Python support

**Steps:**

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Create Railway Project**
   - Visit https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Authorize and select your repository

3. **Add Environment Variables**
   - In Railway dashboard: Variables
   - Add:
     ```
     OPENAI_API_KEY=sk-your-key-here
     FRONTEND_URL=https://your-frontend.vercel.app
     PORT=8000
     ```

4. **Deploy**
   - Railway auto-detects `requirements.txt`
   - Builds and deploys automatically
   - Get public URL from dashboard

5. **Test**
   ```bash
   curl https://your-app.railway.app/api/health
   ```

---

### 2. Docker Container (Flexible)

**Deployment to any Docker-compatible platform**

**Local Docker Test:**

```bash
# Build image
docker build -t ai-interview-api .

# Run container
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=sk-your-key \
  -e FRONTEND_URL=http://localhost:3000 \
  ai-interview-api
```

**Push to Docker Hub:**

```bash
# Login
docker login

# Tag
docker tag ai-interview-api your-username/ai-interview-api:1.0.0

# Push
docker push your-username/ai-interview-api:1.0.0
```

**Deploy to Kubernetes:**

```yaml
# deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-interview-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-interview-api
  template:
    metadata:
      labels:
        app: ai-interview-api
    spec:
      containers:
      - name: api
        image: your-username/ai-interview-api:1.0.0
        ports:
        - containerPort: 8000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: openai-key
        - name: FRONTEND_URL
          value: "https://your-frontend.com"
```

---

### 3. Heroku

**For reliable Python hosting**

**Prerequisites:**
- Heroku CLI installed
- Git repository initialized

**Steps:**

1. **Create Procfile**
   ```
   web: gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
   ```

2. **Add gunicorn to requirements.txt**
   ```bash
   echo "gunicorn==21.2.0" >> requirements.txt
   ```

3. **Login and Create**
   ```bash
   heroku login
   heroku create your-app-name
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set OPENAI_API_KEY=sk-your-key
   heroku config:set FRONTEND_URL=https://your-frontend.com
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **View Logs**
   ```bash
   heroku logs --tail
   ```

---

### 4. AWS Lambda (Serverless)

**Best for sporadic/low-traffic usage**

**Using AWS SAM:**

1. **Create SAM template** (`template.yaml`):
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  AIInterviewAPI:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ./
      Handler: app.main.app
      Runtime: python3.11
      Environment:
        Variables:
          OPENAI_API_KEY: !Ref OpenAIKey
      Events:
        ApiEvent:
          Type: Api
          Properties:
            RestApiId: !Ref Api
            Path: /{proxy+}
            Method: ANY

  Api:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Auth:
        DefaultAuthorizer: None

Parameters:
  OpenAIKey:
    Type: String
    NoEcho: true
```

2. **Deploy:**
   ```bash
   sam build
   sam deploy --guided
   ```

---

### 5. Azure App Service

**Microsoft cloud integration**

1. **Create resource group**
   ```bash
   az group create -n ai-interview -l eastus
   ```

2. **Create App Service plan**
   ```bash
   az appservice plan create \
     -n ai-interview-plan \
     -g ai-interview \
     --sku B1 \
     --is-linux
   ```

3. **Create web app**
   ```bash
   az webapp create \
     -n ai-interview-api \
     -g ai-interview \
     -p ai-interview-plan \
     --runtime "PYTHON|3.11"
   ```

4. **Deploy from Git**
   ```bash
   az webapp up --name ai-interview-api
   ```

5. **Set config**
   ```bash
   az webapp config appsettings set \
     -n ai-interview-api \
     -g ai-interview \
     --settings OPENAI_API_KEY=sk-your-key
   ```

---

### 6. Google Cloud Run

**Containerized, pay-per-use**

1. **Build Docker image**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/ai-interview-api
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy ai-interview-api \
     --image gcr.io/PROJECT_ID/ai-interview-api \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars OPENAI_API_KEY=sk-your-key
   ```

3. **Get URL**
   ```bash
   gcloud run services describe ai-interview-api --region us-central1
   ```

---

## 📊 Comparison Table

| Platform | Setup | Scaling | Cost | Best For |
|----------|-------|---------|------|----------|
| Railway | ⭐⭐ | Auto | $$ | Quick deploy |
| Heroku | ⭐⭐⭐ | Manual | $$$ | Simplicity |
| Docker | ⭐⭐⭐ | Custom | $ | Control |
| Lambda | ⭐⭐⭐⭐ | Auto | $ | Low traffic |
| Cloud Run | ⭐⭐⭐ | Auto | $$ | Google ecosystem |
| Azure | ⭐⭐⭐⭐ | Auto | $$$ | Microsoft stack |

---

## 🔑 Environment Variables for Production

```env
# Required
OPENAI_API_KEY=sk-...                    # Your OpenAI API key

# Application
PORT=8000
HOST=0.0.0.0
DEBUG=False                              # NEVER True in production

# Frontend Integration
FRONTEND_URL=https://your-frontend.com   # For CORS

# Optional
OPENAI_MODEL=gpt-4-turbo-preview
SPACY_MODEL=en_core_web_sm
```

---

## 🔒 Security Checklist

- [ ] Never commit `.env` file with secrets
- [ ] Use secret management (Railway secrets, Heroku config vars, etc.)
- [ ] Enable HTTPS (auto on Railway, Heroku, Cloud Run)
- [ ] Restrict CORS to your frontend domain
- [ ] Set `DEBUG=False` in production
- [ ] Monitor API usage and costs
- [ ] Implement rate limiting
- [ ] Add authentication/authorization if needed
- [ ] Use environment-specific configs
- [ ] Regular security updates

---

## 📈 Monitoring & Logs

### Railway
- Dashboard: https://railway.app/dashboard
- Logs: Real-time in dashboard

### Heroku
```bash
heroku logs --tail
heroku metrics
```

### Docker/K8s
```bash
docker logs <container-id>
kubectl logs <pod-name>
```

### AWS Lambda
- CloudWatch Logs in AWS Console

### Google Cloud Run
- Cloud Logging in GCP Console

---

## 🐛 Troubleshooting Deployment

### Issue: "Build failed - spaCy model not found"
**Solution:** Add to build process:
```bash
# Add to Dockerfile after pip install
RUN python -m spacy download en_core_web_sm
```

### Issue: "CORS errors from frontend"
**Solution:** Verify `FRONTEND_URL` matches your actual frontend URL

### Issue: "OpenAI API errors"
**Solution:** 
- Check API key validity
- Verify account has credits
- Check rate limits
- Review API usage

### Issue: "Cold start too slow"
**Solution:** Use warm containers:
- Railway: Persistent instances
- Heroku: Upgrade dyno type
- Lambda: Use provisioned concurrency
- Cloud Run: Min instances

### Issue: "Memory exceeded"
**Solution:** 
- Increase container memory
- Optimize NLP model loading
- Cache responses

---

## 💰 Cost Estimation

### Monthly (1000 requests/day)

| Platform | Base | Compute | Storage | Total |
|----------|------|---------|---------|-------|
| Railway | Free | $5-10 | $2 | $7-12 |
| Heroku | $0 | $50 | - | $50 |
| Lambda | Free | $1 | $0.20 | $1.20 |
| Cloud Run | Free | $3 | $0.10 | $3.10 |
| Docker (self) | - | $5-20 | - | $5-20 |

*Costs vary based on traffic, model usage, and storage*

---

## 🚀 Production Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] README.md and docs complete
- [ ] .gitignore properly configured
- [ ] requirements.txt up to date
- [ ] Environment variables configured
- [ ] Docker image tested locally
- [ ] Health check working
- [ ] CORS configured
- [ ] API documentation accessible
- [ ] Logs viewable
- [ ] Monitoring set up
- [ ] Scaling configured
- [ ] Backup plan documented
- [ ] Domain name/URL confirmed
- [ ] Frontend integration tested
- [ ] Load testing completed
- [ ] Security audit done
- [ ] Performance optimized
- [ ] Cost monitoring enabled

---

## 🔄 CI/CD Pipeline (GitHub Actions)

**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        uses: CedricZiel/railway-deploy@master
        with:
          args: "up --service=api"
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 📞 Support

- **Railway Support:** https://docs.railway.app
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **OpenAI Status:** https://status.openai.com
- **Python Docs:** https://docs.python.org/3

---

## ✅ Post-Deployment

1. **Test production endpoints**
   ```bash
   curl https://your-api.app/api/health
   curl https://your-api.app/docs
   ```

2. **Monitor first 24 hours**
   - Check logs regularly
   - Monitor API usage
   - Test all endpoints

3. **Update frontend**
   - Point to production API
   - Test integration end-to-end

4. **Document deployment**
   - Record API endpoint
   - Document procedures
   - Create runbooks

---

**Ready to deploy! Choose your platform and follow the steps above. Railway.app is recommended for quickest setup.** 🚀
