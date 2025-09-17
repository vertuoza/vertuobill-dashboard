# Sécurité de l'Application Dashboard

## Configuration Réseau

### Écoute sur 0.0.0.0 dans Docker

**Question** : N'est-ce pas dangereux d'écouter sur `0.0.0.0` ?

**Réponse** : Dans le contexte d'un container Docker, c'est **sécurisé** car :

1. **Isolation du container** : `0.0.0.0` dans le container ne signifie pas `0.0.0.0` sur l'hôte
2. **Mapping de ports** : Seuls les ports explicitement mappés (`-p 3001:3001`) sont exposés
3. **Réseau Docker** : Le container a son propre espace réseau isolé
4. **Proxy inverse** : Dokploy agit comme un proxy inverse, filtrant les requêtes

### Schéma de sécurité

```
Internet → Dokploy (Proxy) → Container Docker (0.0.0.0:3001)
                ↑                        ↑
            Filtrage              Isolé du système hôte
            SSL/TLS               Pas d'accès direct
```

## Mesures de sécurité implémentées

### 1. Helmet.js
- Protection contre les attaques XSS
- Headers de sécurité automatiques
- Protection CSRF
- Politique de sécurité du contenu (CSP)

### 2. CORS configuré
- Origine limitée au domaine de production
- Credentials contrôlés
- Pas d'accès depuis des domaines non autorisés

### 3. Variables d'environnement
- Secrets stockés dans `.env`
- Pas de credentials en dur dans le code
- JWT secret sécurisé

### 4. Gestion des erreurs
- Pas d'exposition des stack traces en production
- Messages d'erreur génériques pour l'utilisateur
- Logs détaillés côté serveur uniquement

## Configuration recommandée pour la production

### Variables d'environnement critiques
```env
NODE_ENV=production
JWT_SECRET=<secret-fort-et-unique>
FRONTEND_URL=https://vertuobill-dashboard.vertuoza.com
```

### Recommandations Dokploy
1. **SSL/TLS** : Toujours utiliser HTTPS
2. **Firewall** : Limiter l'accès aux ports nécessaires
3. **Monitoring** : Surveiller les logs d'accès
4. **Backup** : Sauvegardes régulières des données

## Alternative plus restrictive (si nécessaire)

Si vous souhaitez être encore plus restrictif, vous pouvez :

```javascript
// Écouter seulement sur l'interface locale du container
app.listen(PORT, '127.0.0.1', () => {
  // Mais cela peut causer des problèmes avec Dokploy
});
```

**Note** : Cette configuration peut empêcher Dokploy de communiquer avec l'application.

## Vérification de sécurité

### Tests à effectuer
1. Vérifier que l'application n'est accessible que via le domaine autorisé
2. Tester les headers de sécurité avec des outils comme SecurityHeaders.com
3. Vérifier que les endpoints API nécessitent une authentification appropriée
4. S'assurer que les erreurs ne révèlent pas d'informations sensibles

### Outils recommandés
- `nmap` pour scanner les ports ouverts
- `curl` pour tester les headers de sécurité
- `OWASP ZAP` pour les tests de sécurité automatisés
