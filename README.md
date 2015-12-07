# Welcome to Genomix Application WebServer Node

Genomix Application is intended to do great things for genetics all over the world.

Be proud feeling yourself a part of it!

# Organization

WebServer consists of:

- controllers, the topmost level. This layer is parsing and producing JSON from the actual data.
- services. This is where business logic lives. The services form the actual data. Also access rights are checked here.
- models, which are the data access layer abstraction. Models do actual requests for accessing data sources, such as DB or application service.
