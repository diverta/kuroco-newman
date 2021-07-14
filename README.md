# kuroco-newman

kuroco-newman is an internal-use npm package to manage/run Postman collections at any repository easily.

## Installation
```sh
npm i --save-dev github:diverta/kuroco-newman
```

## Prerequisites
You need to follow the steps below at least to use kuroco-newman package.  

1. Put Postman collection files under specific directory structure
2. Create `kuroco-newman.config.json`

## kuroco-newman cli

You can use `kuroco-newman` cli to initialize your repository and run/manage your collection files.

### Initialization

```
kuroco-newman init
```

### Run Postman collections

```sh
# Run all Postman collections configured in kuroco-newman.config.json
npx kuroco-newman run

# Run only specific Postman collection
npx kuroco-newman run -e path/to/your/environment_file -f path/to/your/collection_file
```


## Reference
### Directory structure
- `kuroco-newman.config.json` must exist in the root of your repository.
- Postman collection files must always be put under the specific directory structure.

```
/
|-- kuroco-newman.config.json
`-- {directory_to_put_testing_files}                    # Any directory name to put your postman files
    `-- {target_site}                                   # Any identifier for your testing target
        |-- collections                                 # Postman collections
        |   `-- {id}                                    # Any identifier for your target API (api_id, API name, etc)   
        |       |-- {category_name_1}                   # Any category name for your collections files (unit, integration, etc)
        |       |   `-- *.postman_collection.json
        |       `-- {category_name_2}                   # (You can make multiple categories if you need)
        |           `-- *.postman_collection.json
        |-- environments                                # Postman environments
        |   `-- *.postman_environment.json
        `-- fixtures                                    # Fixture files for test scripts
            `-- *.*
```

<details>
<summary>Example</summary>

```
/
|-- kuroco-newman.config.json
`-- tests
    `-- kuroco-test
        |-- collections
        |   `-- 1
        |       |-- unit
        |       |   `-- Kuroco-test-unit.postman_collection.json
        |       `-- integration
        |           |-- Kuroco-test-specs-scenario.postman_collection.json
        |           `-- Kuroco-test-specs-pattern.postman_collection.json
        |-- environments
        |   `-- Kuroco-test.postman_environment.json
        `-- fixtures
           　`-- diverta.png
```
</details>

### kuroco-newman.config.json

```js
{
  "baseDir": "path/to/base/directory",
  "report": {
    "outputDir": "path/to/output/report/files",
    "options": {
      "index": {},
      "htmlextra": {}
    }
  },
  "target": [
    {
      "name": "target_site",
      "environment": "file_name.postman_environment.json",
      "collections": [
        {
          "id": "api_id",
          "files": {
            "category_name": "*.json"
          }
        }
      ]
    }
  ]
}
```
