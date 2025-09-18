#!/bin/bash

# Script pour nettoyer le cache Docker et rebuilder l'application
# Usage: ./docker-clean-rebuild.sh

echo "🧹 Nettoyage du cache Docker et rebuild de l'application..."

# Arrêter tous les conteneurs en cours
echo "📦 Arrêt des conteneurs en cours..."
docker-compose down

# Supprimer les images existantes du projet
echo "🗑️  Suppression des images existantes..."
docker rmi $(docker images "dashboard-invoicepack*" -q) 2>/dev/null || echo "Aucune image à supprimer"

# Nettoyer le cache Docker
echo "🧽 Nettoyage du cache Docker..."
docker system prune -f
docker builder prune -f

# Supprimer les volumes (optionnel - décommentez si nécessaire)
# echo "💾 Suppression des volumes..."
# docker volume prune -f

# Rebuild et redémarrer
echo "🔨 Rebuild et redémarrage des conteneurs..."
docker-compose build --no-cache
docker-compose up -d

echo "✅ Terminé ! L'application devrait être disponible sur http://localhost:3000"
echo "📊 Backend API disponible sur http://localhost:3001"

# Afficher les logs en temps réel (optionnel)
echo "📋 Affichage des logs (Ctrl+C pour arrêter)..."
docker-compose logs -f
