# Development Guide

## Community Involvement and Your Role
pdfme is proud to be an open-source project, supported and driven by our enthusiastic community. Whether you're diving into the codebase or raising your voice in our discussions, your involvement is what makes pdfme thrive. 

**Not a coder? No problem!** From reporting bugs and becoming a sponsor to actively participating in discussions, There are many ways you can contribute. We cherish every form of participation and would be delighted to have you be a part of our development journey.

## Bug reports, questions and suggestions

If you have any bugs, or suggestions for the program or documentation, please see below.

All bug reports and discussions are recorded in [GitHub repository](https://github.com/pdfme/pdfme).  
It is possible that some of the problems or questions have already been solved.

- To report application bugs, please use [GitHub issue](https://github.com/pdfme/pdfme/issues).
- For questions or suggestions, please ask them in [GitHub Discussions](https://github.com/pdfme/pdfme/discussions).

## Code Contribution

Basically we accept PRs for bug fixes. However, we might decide to decline your PR if contains code that add new features.
Please remember that pdfme is created to be small and simple as possible.
If you have any questions or suggestions, please feel free to send them to [GitHub Discussions](https://github.com/pdfme/pdfme/discussions) and we will reply as soon as possible.

For insights on development: [How to develop pdfme](https://github.com/pdfme/pdfme/blob/main/DEVELOPMENT.md)

## Roadmap

As of writing this page, we just released Version 2 two weeks ago. However, we already have a plan for how we will proceed with the development of the next version.

As we aim for the release of the next version, given our limited resources, we anticipate it being a long-term plan. Therefore, to ensure we do not lose sight of our developmental direction and to address our users who are anticipating new features, we have written this document.

- ### [V2 Roadmap](https://github.com/orgs/pdfme/projects/5/views/1)  
In this version, we mainly address what needs to be done before the release of V3. Development in V2 will not involve any schema other than the text type schema, and we will proceed with development that doesn't depend on schemas. While being conscious of the V3 release, we will improve the completeness of pdfme itself and work towards decoupling schemas from pdfme.
  - Bug fixes and improvements for text type schema
  - Bug fixes and usability improvements for the UI package
  - Refactoring with V3 in mind
- ### [V3 Roadmap](https://github.com/orgs/pdfme/projects/6/views/1)  
In this version, we will realize a more customizable pdfme to cater to individual user needs. It will be possible to create custom schemas to cater to various needs and designs that better match user sites. We believe that with this version, users will address niche problems and being open source will further make pdfme a special library.
  - [Custom Schema Plugin](https://github.com/pdfme/pdfme/issues/213)
    - Allow users to create custom schemas and define PDF and wysiwyg rendering from the outside.
    - Currently built-in schemas will be packaged separately, and improvements will be made individually.
  - Custom Design for UI
    - Allow changes to the accent color (currently it's light blue)
    - Add class names to each UI component to allow customization from the outside.

## Need technical support?

If you need technical support, please contact the author via [LinkedIn](https://www.linkedin.com/in/hand-dot/).

## Become a sponsor to pdfme

pdfme is an open source project that is free to use.
However, it is not free to develop and maintain pdfme.
If you are using pdfme in your business, please consider becoming a sponsor to pdfme. -> [sponsoring us](https://github.com/sponsors/pdfme)
