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

https://diverta.gyazo.com/0fff117cedb27ba6d52a04eeb2c1f8c3

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

*Generate collection from imported APIs* をチェックすると、インポート時に各エンドポイントに対するリクエストを含むコレクションが自動で生成されるようになります。チェックを外すと、コレクションを全て手動で作成する必要が出てくるため、チェックしておくことを推奨します。
https://diverta.gyazo.com/7f055ad7b9ff2b1d617806f585c8bfc0
<!-- チェックしないとどうなるんだっけ？ 理由も記載しておきたい -->
<!--
    チェックしないとコレクションが自動生成されないだけですが、どちらの方がいいんでしょうかね？
    自動生成されたコレクションは単体テストとしてほぼそのまま使うのが主な用途だと思いますが、それが必要ない場合には一から作った方が楽かもしれません
-->

インポートが完了すると、以下のようなコレクションファイルが生成されます。  
https://diverta.gyazo.com/8952b8018e66fe3893b319eb5648a9e0

インポート直後のコレクションでは、各リクエストのパラメータにダミーの初期値が設定されています。
https://diverta.gyazo.com/353aaaf45f0c68bcedcd22d6a17b6b08

不要なパラメータは削除あるいは無効化して、必要なパラメータは適切な値に書き換える必要があります。
https://diverta.gyazo.com/4db17b0f438b8b5b0e217ff75ff0156e


### テストコードの作成
コレクション内にテストコードを記述します。

#### Collection variablesを定義する
全リクエストで共通利用する変数を[Collection variables](https://learning.postman.com/docs/sending-requests/variables/#choosing-variables)として定義します。

#### Pre-requestスクリプトを定義する
認証が必要なAPIがテスト対象に含まれる場合、テストコードの実行前にログイン処理を行う必要があります。  

[Pre-request script](https://learning.postman.com/docs/writing-scripts/pre-request-scripts/)を利用すると、テストコードの前処理を定義することができます。 

- 例: Pre-requestスクリプト
    ```js
    postman.setGlobalVariable('kuroco', () => ({
        endpoint: {
            login: '/rcms-api/1/auth/login',
            token: '/rcms-api/1/auth/token',
            memberInsert: '/rcms-api/1/members/insert'
        },
        getBaseUrl() {
            const collectionBaseUrl = pm.collectionVariables.get('baseUrl');
            const matches = collectionBaseUrl.match(/{{(.+)}}/);
            if (matches.length > 0) {
                return pm.environment.get(matches[1]);
            }
            return collectionBaseUrl;
        },
        getRequestDef(path, body, accessToken = '') {
            return {
                async: false,
                url: `${this.getBaseUrl()}${path}`,
                method: 'POST',
                header: {
                    'Content-Type': 'application/json',
                    ...accessToken
                        ? {'X-RCMS-API-ACCESS-TOKEN': accessToken}
                        : {}
                },
                body: JSON.stringify(body)
            }
        },
        hasValidToken(tokenGeneratedAt = 0) {
            const hour = 1000 * 60 * 60;
            return _.inRange(Date.now(), tokenGeneratedAt, tokenGeneratedAt + hour);
        },
        generateToken(memberAuth) {
            const loginRequest = this.getRequestDef(this.endpoint.login, {
                ...memberAuth,
                "login_save": 0
            });
            const getTokenRequest = (grant_token) => this.getRequestDef(this.endpoint.token, {
                grant_token
            })

            pm.sendRequest(loginRequest, (err, response) => {
                const { grant_token } = response.json();
                pm.sendRequest(getTokenRequest(grant_token), (err, response) => {
                    console.log(response);
                    const accessToken = response.json().access_token.value;
                    const refreshToken = response.json().refresh_token.value;
                    pm.collectionVariables.set('accessToken', accessToken);
                    pm.collectionVariables.set('refreshToken', refreshToken);
                    pm.collectionVariables.set('tokenGeneratedAt', Date.now());
                    console.log(`genrated new tokens -> accessToken: ${accessToken}, refreshToken: ${refreshToken}`);
                });
            });
        },
        generateAnonymousToken() {
            const getTokenRequest = () => this.getRequestDef(this.endpoint.token, {})

            pm.sendRequest(getTokenRequest(), (err, response) => {
                console.log(response);
                const accessToken = response.json().access_token.value;
                pm.collectionVariables.set('accessToken', accessToken);
                pm.collectionVariables.set('refreshToken', null);
                pm.collectionVariables.set('tokenGeneratedAt', Date.now());
                console.log(`genrated new anonymous tokens -> accessToken: ${accessToken}`);
            });
        },
        switchToTempMember() {
            const timestamp = getTimeStamp();
            const tempMemberAuth = {
                email: `kuroco.e2e.${timestamp}@diverta.co.jp`,
                password: 'test1234',
            };
            const memberInsertRequest = this.getRequestDef(
                this.endpoint.memberInsert,
                {
                    email: tempMemberAuth.email,
                    login_pwd: tempMemberAuth.password,
                    name1: `E2E temporary user ${timestamp}`,
                },
                pm.collectionVariables.get('accessToken')
            );
            pm.sendRequest(memberInsertRequest, (err, response) => {
                this.generateToken(tempMemberAuth);
            });

            function getTimeStamp() {
                const date = new Date();
                return Math.floor(date.getTime()/1000);
            }
        },
        clearStoredToken() {
            pm.collectionVariables.unset('accessToken');
            pm.collectionVariables.unset('refreshToken');
            pm.collectionVariables.unset('tokenGeneratedAt');
        },
    }));
    ```

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
- 例: レスポンスボディの値に対するアサーション
    ```js
    pm.test("Topics details response", function () {
        const jsonData = pm.response.json();
        pm.expect(jsonData.details).to.exist;

        pm.expect(jsonData.details.topics_id).to.be.a('number');
        pm.expect(jsonData.details.ext_col_01).to.eql('Kuroco');
    });
    ```
- 例: `pm.variables`を用いた複数リクエスト間での[変数共有](https://learning.postman.com/docs/sending-requests/variables/)
    ```js
    const jsonData = pm.response.json();
    pm.variables.set('INSERTED_TOPICS_ID', jsonData.id); // 値の保存
    ```
    ```js
    const insertedTopicsId = pm.variables.get('INSERTED_TOPICS_ID'); // 値の読み込み
    pm.expect(jsonData.details.topics_id).to.eql(insertedTopicsId);
    ```
    

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

kuroco-newman.config.json の `target` を編集します。この時、各種ディレクトリやファイルの名前と合わせるようにします。

#### 例
```
kuroco-newman-sample
|-- collections
|   `-- 5
|       `-- unit
|           `- Kuroco-test.postman_collection.json
|-- environments
`-- fixtures
```
上のようなディレクトリ構造の場合、kuroco-newman.config.jsonを以下のように編集します。
```jsonc
{
    "name": "kuroco-newman-sample", 
    "collections": [
        {
            "id": "5", // "{api_id}"
            "files": {
                "unit": "*.json" // "{test_type}": "{glob pattern}"
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
```yaml
name: Newman e2e testing

on:
  push:
    branches:
      - main
    paths:
      - 'tests/newman/**'
      - '!tests/newman/README.md'
  pull_request:
    branches:
      - main
    paths:
      - 'tests/newman/**'
      - '!tests/newman/README.md'
  schedule:
    - cron: "0 15 * * *"
  workflow_dispatch:

jobs:
  newman:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Locally
        uses: actions/checkout@v2
        with:
          persist-credentials: false
      - name: Set PAT (Personal Access Token)
        run: git config --global url."https://${{ secrets.PAT }}@github.com/".insteadOf ssh://git@github.com/
      - name: Install Dependencies
        run: npm install
      - name: Run All Collections
        run: "npm run test:newman:all"
      - name: Upload test report
        uses: actions/upload-artifact@v2
        if: always()
        with:
          name: reports
          path: reports

```

### GitHubリモートリポジトリにpush


## Tips

### 結合テストの作成
以下のように複数のAPIを使った結合テストを作成したい場合は、複数のリクエストをコピーして組み合わせることで実現できます。

1. コンテンツの新規追加 (`Topics::insert`)
2. 追加したコンテンツの取得 (`Topics::details`)
3. 取得結果のアサーション

#### フォルダの作成
1つのシナリオはコレクション内の1つのフォルダに対応します。まずはフォルダを作成します。
https://diverta.gyazo.com/bf8db63513bcbee00b46e8eed064ce8c

必要に応じて、Pre-requestにAPIの認証を行うコードを追加します。
https://diverta.gyazo.com/57f49e8486ae95b917a088f2063a4946

#### リクエストの追加
1. コンテンツの新規追加 (`Topics::insert`)

    コンテンツを追加するリクエスト (`Topics::insert`) をコレクションに追加します。

    レスポンスのidなどの値を他のリクエストで使うため、Testsスクリプトで`pm.variables`を用いて値を変数に保存します。
    https://diverta.gyazo.com/a6e192518c304537bb4d53bba00f022c

2. 追加したコンテンツの取得 (`Topics::details`)

    追加したコンテンツを取得するリクエスト (`Topics::details`) を、コンテンツ追加リクエストの後ろに追加します。

    先ほど保存した変数を利用して、リクエストのパラメータを構成します。
    https://diverta.gyazo.com/91c16ba3b9f58d0db474745ffc75548e

3. 取得結果のアサーション

    コンテンツ取得リクエストのTestsスクリプトに、取得結果に対するアサーションを追加します。
    - 例
        ```js
        pm.test("Response check", function () {
            const jsonData = pm.response.json();
            pm.expect(jsonData.details).to.exist;

            pm.expect(jsonData.details.topics_id, "topics_id").to.eql(pm.variables.get("topics_id"));
            pm.expect(jsonData.details.subject, "subject").to.eql("Insert Test");
            pm.expect(jsonData.details.ext_col_01, "ext_col_01").to.eql("test");
        });
        ```

#### 実行例
https://diverta.gyazo.com/9e022bcc0587ba123bc8ebf9cf72ace6

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
    globalsファイルに定義したスクリプトは、以下のようにして使用します。
    ```js
    const kuroco = eval(globals.kuroco)();
    kuroco.generateToken({
        ...
    });
    ```

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
