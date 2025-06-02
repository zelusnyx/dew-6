# Documentation

* We use `[mkdocs](https://mkdocs.readthedocs.io/en/latest/)` to generate documentation pages
* The pages are written in markdown

## Development and Testing
* To edit and test pages, edit the markdown files in the `docs` directory.
* Images are present in `docs/img` directory.
* Install dependencies using the command `pip install -r requirements.txt`
* Start the development server using `mkdocs serve`

## Deployment
* Build the site using `mkdocs build`
* Commit with the built files and push to git
* Do a git pull on dew server and reload nginx