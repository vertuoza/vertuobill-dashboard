# Guide de Gestion des Variables d'Environnement

## 🔐 Sécurité des Variables d'Environnement

### ⚠️ IMPORTANT : Ne jamais commiter le fichier `.env` !

Le fichier `.env` contient des informations sensibles (mots de passe, clés secrètes) et ne doit **JAMAIS** être ajouté au contrôle de version Git.

## 📝 Configuration Locale (Développement)

### 1. Créer votre fichier `.env` local

Copiez `.env.example` vers `.env` et remplissez avec vos vraies données :

```bash
cp .env.example .env
```

Puis éditez `.env` avec vos vraies valeurs :

```bash
# Backend Environment Variables
PORT=3001
JWT_SECRET=votre-vraie-cle-jwt-super-secrete
FRONTEND_URL=http://localhost:3001

# Database Configuration MySQL (Base principale)
DB_HOST=votre-host-db
DB_PORT=3306
DB_NAME=votre_vraie_base
DB_USER=votre_user_db
DB_PASSWORD=votre_mot_de_passe_db

# Database Configuration MySQL (Base secondaire)
DB2_HOST=votre-host-db2
DB2_PORT=3306
DB2_NAME=votre_vraie_base2
DB2_USER=votre_user_db2
DB2_PASSWORD=votre_mot_de_passe_db2
```

### 2. Vérifier le .gitignore

Assurez-vous que `.env` est dans votre `.gitignore` :

```
.env
.env.local
.env.production
```

## 🚀 Configuration Production (DokPloy)

### Option 1 : Variables d'environnement DokPloy (RECOMMANDÉ)

Dans l'interface DokPloy, configurez les variables d'environnement directement :

```
PORT=3001
JWT_SECRET=votre-cle-jwt-production-ultra-secrete
FRONTEND_URL=https://votre-domaine.com
DB_HOST=votre-serveur-db-production
DB_PORT=3306
DB_NAME=votre_base_production
DB_USER=votre_user_production
DB_PASSWORD=votre_mot_de_passe_production
DB2_HOST=votre-serveur-db2-production
DB2_PORT=3306
DB2_NAME=votre_base2_production
DB2_USER=votre_user2_production
DB2_PASSWORD=votre_mot_de_passe2_production
NODE_ENV=production
```

### Option 2 : Fichier .env en production

Si vous devez utiliser un fichier `.env` en production :

1. Créez le fichier directement sur le serveur
2. **NE LE COMMITEZ JAMAIS** dans Git
3. Utilisez des permissions restrictives : `chmod 600 .env`

## 🐳 Docker et Variables d'Environnement

### Test local avec Docker

```bash
# Avec fichier .env
docker run -p 3001:3001 --env-file .env dashboard-invoicepack

# Avec variables inline
docker run -p 3001:3001 \
  -e DB_HOST=localhost \
  -e DB_USER=myuser \
  -e DB_PASSWORD=mypassword \
  dashboard-invoicepack
```

### Production avec DokPloy

DokPloy gère automatiquement l'injection des variables d'environnement dans le container Docker.

## 🔄 Migration des Données

Si vous avez perdu vos variables d'environnement, voici comment les récupérer :

### 1. Vérifier votre historique Git (si elles étaient commitées par erreur)

```bash
git log --oneline -p | grep -A 10 -B 10 "DB_"
```

### 2. Vérifier vos backups locaux

```bash
# Chercher des fichiers .env dans vos backups
find ~ -name ".env*" -type f 2>/dev/null
```

### 3. Vérifier votre serveur de production

Si l'app fonctionne déjà en production, les variables sont probablement configurées dans DokPloy.

## 📋 Checklist de Sécurité

- [ ] `.env` est dans `.gitignore`
- [ ] Pas de variables sensibles dans le code source
- [ ] JWT_SECRET différent entre dev et production
- [ ] Mots de passe de base de données forts
- [ ] Variables d'environnement configurées dans DokPloy
- [ ] Permissions restrictives sur les fichiers .env (600)

## 🆘 En cas de problème

1. **Variables perdues** : Recréez `.env` avec vos vraies données
2. **App ne se connecte pas à la DB** : Vérifiez les variables DB_*
3. **Erreur JWT** : Vérifiez JWT_SECRET
4. **CORS errors** : Vérifiez FRONTEND_URL

## 💡 Bonnes Pratiques

- Utilisez des noms de variables explicites
- Documentez chaque variable dans `.env.example`
- Utilisez des valeurs par défaut sécurisées quand possible
- Séparez les environnements (dev/staging/prod)
- Rotez régulièrement les secrets (JWT_SECRET, mots de passe)
