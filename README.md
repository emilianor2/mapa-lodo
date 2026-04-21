# 🏛️ LODO – Startup Ecosystem Platform (Cloud Native)

> Full stack platform deployed on Google Cloud, designed with scalability, security and DevOps practices.

🔗 **Live demo:**
https://lodo-frontend-412424314458.southamerica-east1.run.app/map

---

## 📌 Description

LODO is a full stack platform designed to manage and visualize startup ecosystems.

The system centralizes startup data, enabling scalable management and visualization within a modern cloud-native architecture.

---

## 🚀 What this project demonstrates

* ✔️ Full stack development (React + Go)
* ✔️ Cloud deployment on Google Cloud Platform
* ✔️ Containerization with Docker
* ✔️ CI/CD deployment workflows
* ✔️ Scalable architecture with Cloud Run
* ✔️ Secure configuration management

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Radix UI

### Backend

* Go (Clean Architecture)

### Cloud & Infrastructure

* Google Cloud Run
* Artifact Registry
* Cloud SQL (MariaDB)

### DevOps

* Docker
* Docker Compose
* Nginx

---

## ⚙️ Architecture Overview

* Frontend SPA served via Nginx
* Backend REST API built in Go
* Managed relational database (Cloud SQL)
* Containerized services deployed on Cloud Run

---

## 🔒 Configuration & Security

### Backend

* Environment variables via `os.Getenv`
* No direct dependency on `.env` files in production
* Ready for secret managers

### Frontend

* Build-time environment injection
* No exposure of sensitive data in client-side code

---

## ☁️ Cloud Infrastructure (GCP)

* **Cloud Run** → container execution
* **Artifact Registry** → Docker images
* **Cloud SQL** → managed database

### Key features:

* Auto-scaling
* High availability
* Reproducible deployments

---

## 🗂️ Project Structure

```
lodo/
├── frontend/
├── backend/
├── docker/
├── docker-compose.yml
└── README.md
```

---

## 💻 Local Development

```bash
docker-compose up --build
```

---

## 🖥️ Services

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost      |
| Backend  | http://localhost:8080 |

---

## 🚀 Deployment

Deployment is based on immutable Docker images stored in Artifact Registry.

Example:

```bash
docker build -t gcr.io/project/frontend:v1 .
docker push gcr.io/project/frontend:v1
gcloud run services update lodo-frontend --image gcr.io/project/frontend:v1
```

---

## 🔐 Repository Security

* Secrets excluded via `.gitignore`
* No sensitive data committed
* Production-ready structure

---

## 👨‍💻 Authors

Leonel Valdivia
Martín López
Gabriel Macocco
Emiliano Rodríguez
