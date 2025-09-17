# Déploiement Docker avec DokPloy

Ce projet est configuré pour être déployé avec Docker et DokPloy. Voici comment procéder :

## 📋 Prérequis

- Docker installé sur votre machine
- Accès à DokPloy
- Variables d'environnement configurées

## 🐳 Configuration Docker

Le projet utilise un Dockerfile multi-stage optimisé pour la production :

### Structure du build :
1. **Stage Builder** : Compile le TypeScript et build les assets
   - Build du package `shared` (types partagés)
   - Build du `frontend` (React + Vite)
   - Build du `backend` (Node.js + Express)

2. **Stage Production** : Image finale optimisée
   - Basée sur `node:18-alpine` (légère)
   - Utilisateur non-root pour la sécurité
   - Seulement les fichiers nécessaires en production

## 🚀 Déploiement avec DokPloy

### 1. Variables d'environnement

Créez un fichier `.env` basé sur `.env.example` :

```bash
# Base de données
DATABASE_URL=your_database_url

# JWT
JWT_SECRET=your_jwt_secret_key

# API
API_PORT=3001
FRONTEND_URL=http://localhost:3000

# Autres variables selon vos besoins
```

### 2. Configuration DokPloy

Dans DokPloy, configurez votre application avec :

- **Repository** : `https://github.com/KevinVermeulen/vertuobill-dashboard.git`
- **Branch** : `main` (ou votre branche de production)
- **Build Context** : `/` (racine du projet)
- **Dockerfile** : `Dockerfile` (à la racine)

### 3. Ports exposés

L'application expose le port **3001** pour l'API backend.
Le frontend est servi en tant que fichiers statiques par le backend.

### 4. Commandes Docker locales

```bash
# Build de l'image
docker build -t dashboard-invoicepack .

# Run du container
docker run -p 3001:3001 --env-file .env dashboard-invoicepack

# Run avec variables d'environnement inline
docker run -p 3001:3001 \
  -e DATABASE_URL=your_db_url \
  -e JWT_SECRET=your_secret \
  dashboard-invoicepack
```

## 📁 Structure des fichiers

```
/
├── Dockerfile              # Configuration Docker multi-stage
├── .dockerignore           # Fichiers exclus du build Docker
├── package.json            # Dependencies du workspace
├── packages/
│   ├── backend/           # API Node.js/Express
│   ├── frontend/          # Interface React/Vite
│   └── shared/            # Types TypeScript partagés
└── README-DOCKER.md       # Ce fichier
```

## 🔧 Optimisations incluses

- **Multi-stage build** : Réduction de la taille de l'image finale
- **Cache Docker** : Optimisation des layers pour des builds plus rapides
- **Sécurité** : Utilisateur non-root, dumb-init pour la gestion des processus
- **Production ready** : Seulement les dépendances de production installées

## 🐛 Dépannage

### Build qui échoue
- Vérifiez que toutes les dépendances sont installées
- Assurez-vous que les types TypeScript sont corrects
- Consultez les logs de build Docker

### Application qui ne démarre pas
- Vérifiez les variables d'environnement
- Assurez-vous que le port 3001 est disponible
- Consultez les logs du container : `docker logs <container_id>`

### Problèmes de réseau
- Vérifiez que les ports sont correctement exposés
- Assurez-vous que `FRONTEND_URL` pointe vers la bonne adresse

## 📞 Support

Pour toute question concernant le déploiement, consultez :
- Les logs DokPloy
- Les logs Docker : `docker logs <container_name>`
- La documentation DokPloy officielle
