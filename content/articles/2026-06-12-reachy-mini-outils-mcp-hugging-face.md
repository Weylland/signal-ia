---
title: Hugging Face connecte des outils MCP au robot Reachy Mini
date: '2026-06-12T06:30:00.000Z'
excerpt: >-
  Le protocole MCP arrive sur le petit robot open source de Hugging Face — les
  agents IA peuvent désormais le piloter comme un outil.
tags:
  - robotique
  - mcp
  - open-source
sources:
  - name: Hugging Face Blog
    url: 'https://huggingface.co/blog/adding-mcp-tools-to-reachy-mini'
image: >-
  https://huggingface.co/blog/assets/adding-mcp-tools-to-reachy-mini/reachy_mini_remote_spaces_thumbnail.png
---
Hugging Face publie un guide pour ajouter des outils MCP (Model Context Protocol) à Reachy Mini, son petit robot de bureau open source.

Le rapprochement est significatif : MCP est devenu le standard de facto pour connecter des agents IA à des outils externes — bases de données, APIs, navigateurs. L'appliquer à un robot physique signifie qu'un agent conversationnel peut piloter Reachy Mini de la même façon qu'il appelle n'importe quel autre outil : le robot devient une extension du modèle, exposée via un protocole standardisé.

Pour les développeurs, c'est une porte d'entrée concrète vers la robotique pilotée par LLM, sans framework propriétaire : un serveur MCP expose les capacités du robot (mouvements, caméra, audio), et n'importe quel agent compatible peut les invoquer. Une brique de plus dans la stratégie de Hugging Face pour faire de la robotique open source un terrain d'expérimentation aussi accessible que les modèles eux-mêmes.
