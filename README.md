# asken2pixela

## Usage of local batch
The code in `local` can be locally executed to (1) retrieve asken score data with puppeteer and (2) record retrived data to Pixela graph.

### 1. install
```bash
$ git clone https://github.com/jagijagijag1/asken2pixela
$ cd local
$ yarn install
```

### 2. set your asken & pixela info
Describe your asken and pixela info to local/batch-config.json
```json:local/batch-confg.json
{
  "askenEmail": "<your asken email address",
  "askenPass": "<your asken login password",
  "startDate": "<start date of asken socre you want to record, e.g. 20190929>",
  "endDate": "<end date of asken socre you want to record, e.g. 20191003>",
  "pixelaUser": "<your pixela user id>",
  "pixelaGraphId": "<your pixela graph for recording asken score",
  "pixelaToken": "<your pixela user token>"
}
```

### 3. run on local & record score in a batch manner
```bash
$ yarn start
```