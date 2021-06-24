# kuroco-newman
Newman library for Kuroco API

下記のソースコードをパッケージ化するためのリポジトリです。  
https://github.com/diverta/kuroco_e2e_test/tree/main/src/newman


パッケージのインストール後、任意のリポジトリで以下の手順を実施するだけで  
APIのE2Eテスト環境を簡単に作成できるようにするのが目標です。

1. configファイルの配置  
  https://github.com/diverta/kuroco_e2e_test/blob/main/kuroco-newman.config.json
2. Postmanコレクションファイルの配置  
  https://github.com/diverta/kuroco_e2e_test/tree/main/tests/newman
3. GitHub Actionsワークフロー設定  
  https://github.com/diverta/kuroco_e2e_test/blob/main/.github/workflows/newman.yaml
