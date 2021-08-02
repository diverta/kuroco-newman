# kuroco-newman 導入方法

## インストール
初めに、E2Eテストを導入する対象のリポジトリにkuroco-newmanをインストールします。
```sh
npm install --save-dev github:diverta/kuroco-newman
```

インストールが完了したら、`kuroco-newman init`を実行し、テストの実行に必要なファイル・ディレクトリの初期化を行います。

```sh
npx kuroco-newman init
```

<!--
    initしてる動画を載せる
-->

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

次に、テスト対象のAPIの`openapi.json`ファイルを取得します。  

```sh
kuroco-newman openapi-fetch --id {api_id} --key {sdk_key}
```
<!--
    cliを少し改善したいので、詳細は後で書くことにします
-->

## Postmanファイルの作成
### ワークスペースの作成
Postmanのワークスペースを作成します。ワークスペースはテスト対象のサイト毎に作成することを推奨します。

### openapi.jsonのインポート
Postmanで [Import] -> [File] を選び、インストール時に取得したopenapi.jsonを選択してください。

*Generate collection from imported APIs* をチェックすることを推奨します。
https://diverta.gyazo.com/7f055ad7b9ff2b1d617806f585c8bfc0
<!-- チェックしないとどうなるんだっけ？ 理由も記載しておきたい -->

インポートが完了すると、以下のようなコレクションファイルが生成されます。  
https://diverta.gyazo.com/8952b8018e66fe3893b319eb5648a9e0

インポート直後のコレクションには、ダミーの初期値が設定されているため、不要なものを削除する必要があります。
<!--
    編集する必要のある箇所の名前と、画像を載せる
-->

### テストコードの作成
コレクション内にテストコードを記述します。

#### Collection variablesを定義する
全リクエストで共通利用する変数を[Collection variables](https://learning.postman.com/docs/sending-requests/variables/#choosing-variables)として定義します。

#### Pre-requestスクリプトを定義する
認証が必要なAPIがテスト対象に含まれる場合、テストコードの実行前にログイン処理を行う必要があります。  

[Pre-request script](https://learning.postman.com/docs/writing-scripts/pre-request-scripts/)を利用すると、テストコードの前処理を定義することができます。 

<!--
    Pre-requestスクリプトのサンプルを載せる (とりあえずkuroco_e2e_testのglobals.kurocoに設定しているものでOK、後でもうちょっとシンプルにする)
-->

#### リクエストのTestsスクリプトを編集する
Testsタブを開き、各リクエスト毎のテストコードを記述していきます。

頻繁に利用する記法のサンプルを以下に記載します。  
より詳しいスクリプトの書き方は[Postmanのドキュメント](https://learning.postman.com/docs/)を参照してください。

- 例: レスポンスステータスコードに対するアサーション
    ```js
    pm.test("Status code is 200", function () {
        pm.response.to.have.status(200);
    });
    ```
    <!--
        追加で何個かよく使う記法のサンプルも載せたい
        - レスポンスの値のアサーション
        - pm.variablesを使ったコレクション間の変数共有
    -->

### テストコードの保存



作成したPostmanのコレクションファイルを[エクスポート](https://learning.postman.com/docs/getting-started/importing-and-exporting-data/#exporting-collections)します。


インポートしたファイルを、`kuroco-newman init`で自動生成されたディレクトリの下に配置します。  


```
{site_name}
|-- collections
|   `-- {api_id}
|       `-- {test_type}                     # unit, integration, etc.
|           `- {Postman collection file}
|-- environments
`-- fixtures
```

kuroco-newman.config.json の `target` を編集する
各種ディレクトリ・ファイルの名前と合わせる

#### 例
<!--
    対応するディレクトリのツリーも出しておきたい (比較できるとわかりやすいので)
-->
```jsonc
{
    "name": "kuroco-newman-sample", 
    "collections": [
        {
            "id": "1", // "{api_id}"
            "files": {
                "openapi": "*.json" // "{test_type}": "{glob pattern}"
            }
        }
    ]
}
```

## テストコードの実行

### ローカル環境での動作確認
以下のコマンドでテストが動きます。
```sh
npx kuroco-newman run
```

完了後、kuroco-newman.config.jsonの`report.outputDir`で指定したディレクトリに、テスト結果のレポートが出力されます。  
https://diverta.gyazo.com/bc6206309b15a477c5fea0be14e015c8

### GitHub Actionsの設定


- PATの設定(publicリポジトリ化されたら不要かもしれない)
- ワークフローの設定
<!--
    動くもののサンプルyamlを貼っておく
    レポートのデプロイについては省いて良い (どこにデプロイするかの選定は場合によって変わるため)
-->

### GitHubリモートリポジトリにpush


## Tips

### 結合テストの作成
以下のように複数のAPIを使った結合テストを作成したい場合は、複数のリクエストをコピーして組み合わせることで実現できます。

1. コンテンツの新規追加 (`Topics::insert`)
2. 追加したコンテンツの取得 (`Topics::details`)
3. 取得結果のアサーション

<!--
    もうちょっと手順の詳細を書く
-->

### 共通ファイルの作成
複数のコレクションを定義している場合は、各コレクション毎にCollection variablesやPre-requestを用意する必要がありますが、  
コレクション間で完全に共通の定義を利用したい場合、これは非常に煩雑な作業となります。

そのような場合は以下の方法で、共通利用可能な変数・スクリプトを定義することができます。

#### Postmanファイルの作成
- Environment  
    コレクション間で共通の環境変数を定義したい場合は、[Environment](https://learning.postman.com/docs/sending-requests/managing-environments/)ファイルを利用します。  
    https://diverta.gyazo.com/584cdd26b1648aaceb5e1e139de78476

    environmentファイルは複数作成することが可能です。  
    参照先のファイルは画面右上のプルダウンから切り替えることができます。
    https://diverta.gyazo.com/11a9fd7bd9fd456da0e85fa77c0dd1f8
- Globals  
    コレクション間で共通のスクリプトを定義したい場合は、globalsファイルを利用します。  
    https://diverta.gyazo.com/bbadcf4f82827a7355874bdb25654f37
    <!--
        - eval(pm.globals.kuroco)()でロードするサンプルコードを記載
    -->

#### テスト管理ディレクトリの設定
作成したファイルは、`kuroco-newman init`で自動生成された`environments`ディレクトリの配下に保存します。
```
{site_name}
|-- collections  
`-- environments
    |-- {Postman envitonment file}          # optional
    `-- {Postman globals file}              # optional
```

#### kuroco-newman.config.jsonの設定
以下のように、保存したenvironment/globalsファイルの名称を指定します。  

```jsonc
// "targets": [
{
    "name": "kuroco-test", 
    "environment": "Kuroco-test.postman_environment.json", // optional
    "globals": "Kuroco-test.postman_globals.json", // optional
    "collections": [
        // ...
    ]
}
// ]
```
