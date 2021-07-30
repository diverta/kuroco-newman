# kuroco-newman 導入方法

## Postman
1. openapi.jsonをPostmanにインポートする
    - openapi.json は`Api::openapi_data`を叩くと取得できる (openapi.jsonの本体はレスポンスの`openapi_data`プロパティにあるので、注意)
        <!-- kuroco-newman openapi-fetch での取得方法も書いておきたい (なので、最初リポジトリへのインストール手順から始めた方がいいかも、、) -->
    - Postmanで Import -> File を選び、取得したopenapi.jsonを選択する
    - *Generate collection from imported APIs* をチェックすることを推奨 https://diverta.gyazo.com/7f055ad7b9ff2b1d617806f585c8bfc0
        <!-- チェックしないとどうなるんだっけ？ 理由も記載しておきたい -->

3. 必要に応じて、environmentファイル、globalsファイル、Pre-requestスクリプトを作成する
<!--
    Pre-requestスクリプトのサンプルを載せる
-->
<!--
    コレクション間で共通のスクリプトを設定したい場合にglobalsファイルで扱う方法を記載
    - pm.globals.kurocoとして設定する
    - eval(pm.globals.kuroco)()でロードする
-->

4. コレクション内にテストを作成する
    - リクエストのTestsスクリプトを編集する
    - 例: レスポンスステータスコードに対するアサーション
        ```js
        pm.test("Status code is 200", function () {
        pm.response.to.have.status(200);
        });
        ```
        <!--
            追加で何個かよく使う記法のサンプルも載せたい (主にレスポンスの値のアサーションと、コレクション間の変数共有)
        -->
    - 詳しいTestsスクリプトの書き方はPostmanのドキュメントを参照 https://learning.postman.com/docs/

## Kuroco-Newman
1. 任意のリポジトリにkuroco-newmanをインストールする
    ```sh
    npm install diverta/kuroco-newman
    ```
2. `kuroco-newman init` を動かす
    ```sh
    npx kuroco-newman init
    ```
    - *tests base directory* と *report output directory* はほとんどの場合デフォルトのままで問題なし
    - *target site name* にはサイト名を指定すると良い
    - カレントディレクトリ内に以下のものが生成される
        ```
        .
        |-- reports
        |-- tests
        |   `-- {site_name}
        |       |-- collections
        |       |-- environments
        |       `-- fixtures
        `-- kuroco-newman.config.json
        ```

3. 必要なファイルを配置する
    - Postmanコレクションファイル、environmentファイル、globalsファイルをエクスポートして、以下のディレクトリに配置する (必要なディレクトリは作成する)
        ```
        {site_name}
        |-- collections
        |   `-- {api_id}                            
        |       `-- {test_type}                     # unit, integration, etc.
        |           `- {Postman collection file}    
        `-- environments
            |-- {Postman envitonment file}          # optional
            `-- {Postman collection file}           # optional
        ```

4. kuroco-newman.config.json の `target` を編集する
    - 各種ディレクトリ・ファイルの名前と合わせる
        #### 例
        <!--
            対応するディレクトリのツリーも出しておきたい (比較できるとわかりやすいので)
        -->
        ```jsonc
        {
            "name": "kuroco-test", 
            "alias": "kuroco-test-2", // optional, unique name
            "environment": "Kuroco-test.postman_environment.json", // optional
            "globals": "Kuroco-test.postman_globals.json", // optional
            "collections": [
                {
                    "id": "1", // {api_id}
                    "files": {
                        "test_success": "*.json" // "{test_type}": "{glob pattern}"
                    }
                }
            ]
        }
        ```

5. 動作確認
    - 以下のコマンドでテストが動く
        ```sh
        npx kuroco-newman run
        ```
    - reportsディレクトリにテストの結果が出力される
    
6. GitHub Actionsの設定
    - PATの設定(publicリポジトリ化されたら不要かもしれない)
    - ワークフローの設定

7. Github リモートリポジトリにpushする
