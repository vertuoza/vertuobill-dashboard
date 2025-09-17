# VertuoBill Dashboard

Dashboard moderne pour la gestion des clients et factures, développé en React/Node.js avec architecture monorepo.

## 🚀 Fonctionnalités

- **Dashboard interactif** avec statistiques en temps réel
- **Gestion des clients** avec tableau avancé (tri, filtrage, pagination)
- **Filtres de date** pour analyser les données par période
- **Recherche en temps réel** par nom, email ou téléphone
- **Interface responsive** avec Tailwind CSS
- **Authentification sécurisée** avec JWT
- **Architecture monorepo** avec packages partagés
- **Support MySQL** avec fallback sur données mockées

## 📁 Structure du projet

```
dashboard-invoicePack/
├── packages/
│   ├── frontend/          # Application React + Vite
│   ├── backend/           # API Node.js + Express
│   └── shared/            # Types TypeScript partagés
├── .env.example           # Variables d'environnement
└── package.json           # Configuration workspace
```

## 🛠 Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- MySQL (optionnel)

### Installation rapide
```bash
# Cloner le projet
git clone <votre-repo>
cd dashboard-invoicePack

# Installer toutes les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Démarrer en mode développement
npm run dev
```

## ⚙️ Configuration

### Variables d'environnement (.env)

```bash
# Backend
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:5173

# Base de données MySQL (optionnel)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password

NODE_ENV=development
```

### Configuration MySQL (optionnel)

Le système fonctionne avec des données mockées par défaut. Pour utiliser MySQL :

1. **Créer la base de données** avec les tables requises
2. **Configurer les variables DB_*** dans `.env`
3. **Redémarrer le serveur**

#### Requêtes SQL utilisées

```sql
-- Sociétés avec adresses
SELECT s.societe_name, a.adresse_rue, a.adresse_numero, a.adresse_cp, a.adresse_pays, s.societe_valid, s.societe_datecrea
FROM societe s 
INNER JOIN adresse a ON a.adresse_id = s.societe_adresse_id
WHERE s.pack = 11

-- Contact principal
SELECT u.user_pname, u.user_name, u.user_phone 
FROM user u 
WHERE u.user_societe_id = ? AND u.user_compte = 1 AND u.user_type = 1 AND u.user_valid = 1

-- Compteurs
SELECT count(*) FROM facturation WHERE societe_id = ?
SELECT count(*) FROM contacts WHERE societe_id = ?
SELECT count(*) FROM entreprise WHERE societe_id = ?
SELECT count(*) FROM facture_fournisseur WHERE societe_id = ?
```

## 🚀 Utilisation

### Démarrage
```bash
npm run dev
```

### Accès
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001
- **Health Check** : http://localhost:3001/api/health

### Authentification
- **Username** : `admin`
- **Password** : `admin123`

## 📊 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion

### Clients
- `GET /api/clients` - Liste paginée avec filtres
  - `page` : Numéro de page
  - `limit` : Éléments par page
  - `search` : Recherche textuelle
  - `dateFrom` : Date de début
  - `dateTo` : Date de fin
  - `sortBy` : Colonne de tri
  - `sortOrder` : `asc` ou `desc`

## 🎨 Interface

### Dashboard
- **Statistiques** : Clients, factures, entreprises, fournisseurs
- **Graphiques** : Évolution des données
- **Navigation** : Menu latéral responsive

### Tableau clients
- **Tri** : Clic sur les en-têtes de colonnes
- **Filtrage** : Recherche temps réel + filtres de date
- **Pagination** : Navigation complète
- **Actions** : Boutons filtrer/effacer

## 🔧 Développement

### Scripts disponibles
```bash
# Développement (tous les packages)
npm run dev

# Build production
npm run build

# Linting
npm run lint

# Tests (à implémenter)
npm test
```

### Architecture

#### Frontend (React + Vite)
- **React 18** avec TypeScript
- **Tailwind CSS** pour le styling
- **React Query** pour la gestion d'état serveur
- **React Router** pour la navigation
- **Heroicons** pour les icônes

#### Backend (Node.js + Express)
- **Express** avec TypeScript
- **JWT** pour l'authentification
- **MySQL2** pour la base de données
- **Helmet** pour la sécurité
- **CORS** configuré

#### Shared
- **Types TypeScript** partagés
- **Interfaces** communes
- **Utilitaires** réutilisables

## 🔒 Sécurité

- **JWT** avec expiration
- **Helmet** pour les headers de sécurité
- **CORS** configuré
- **Validation** des entrées
- **Gestion d'erreurs** centralisée

## 📈 Performance

- **Pagination** côté serveur
- **Debounce** sur la recherche
- **Lazy loading** des composants
- **Optimisation** des requêtes SQL
- **Cache** des requêtes avec React Query

## 🚧 Roadmap

- [ ] Tests unitaires et d'intégration
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Monitoring et logs
- [ ] Documentation API (Swagger)
- [ ] Gestion des rôles utilisateurs
- [ ] Export des données (CSV, PDF)
- [ ] Notifications en temps réel

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Contacter l'équipe de développement

---

**VertuoBill Dashboard** - Solution moderne de gestion client 🚀
