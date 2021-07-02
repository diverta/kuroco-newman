# kuroco-newman

This is a repository to make a npm package based on the following source codes.
https://github.com/diverta/kuroco_e2e_test/tree/main/src/newman

The purpose is that everyone can create an environment for E2E testing easily by installing this package into any repository then setting as below.

1. Put configuration json file  
  https://github.com/diverta/kuroco_e2e_test/blob/main/kuroco-newman.config.json
2. Put Postman collection files  
  https://github.com/diverta/kuroco_e2e_test/tree/main/tests/newman
3. Configure GitHub Actions workflow  
  https://github.com/diverta/kuroco_e2e_test/blob/main/.github/workflows/newman.yaml

## Install
```sh
npm i github:diverta/kuroco-newman
```

## Prerequisites
You need to follow the steps below at least to use kuroco-newman client.  
(These steps will be automated in the near future by implementing `kuroco-newman init`)

1. Put Postman collection files under specific directory structure
2. Create `kuroco-newman.config.json`

### Directory structure
You need to put your collection files under the following structure.

```
.
`-- {directory_to_put_testing_files}                    # Any directory name to put your postman files
    `-- {target_site}                                   # Any identifier for your testing target
       |-- apis
       |   `-- {id}                                     # Any identifier for your target API (api_id, API name, etc)
       |       `-- collections                          # Postman collections
       |           |-- {category_name_1}                # Any category name for your collections files (unit, integration, etc)
       |           |   `-- *.postman_collection.json
       |           `-- {category_name_2}                # (You can make multiple categories if you need)
       |               `-- *.postman_collection.json
       |-- environments                                 # Postman environments
       |   `-- *.postman_environment.json
       `-- fixtures                                     # Fixture files for test scripts
           `-- *.*
```

For example:
```
.
`-- tests
    `-- kuroco-test
       |-- apis
       |   `-- 1
       |       `-- collections
       |           |-- unit
       |           |   `-- Kuroco-test-unit.postman_collection.json
       |           `-- integration
       |               |-- Kuroco-test-specs-scenario.postman_collection.json
       |               `-- Kuroco-test-specs-pattern.postman_collection.json
       |-- environments
       |   `-- Kuroco-test.postman_environment.json
       `-- fixtures
           `-- diverta.png
```

### kuroco-newman.config.json

First, please create a file on the root of your repository.

```sh
cd path/to/your/repository/root
touch kuroco-newman.config.json
```

Second, please configure the file as below.
```js
{
  "baseDir": "path/to/base/directory",
  "report": {
    "outputDir": "path/to/output/report/files",
    "templates": {
      // "index": "path/to/your/custom/template.hbs"
    }
  },
  "target": [
    {
      "name": "target_site",
      "environment": "file_name.postman_environment.json",
      "apis": [
        {
          "id": "api_id",
          "collections": {
            "category_name": "*.json"
          }
        }
      ]
    }
  ]
}
```

## Usage

```sh
# Run all Postman collections configured in kuroco-newman.config.json
npx kuroco-newman run

# Run only specific Postman collection
npx kuroco-newman run -e path/to/your/environment_file -f path/to/your/collection_file
```
```
