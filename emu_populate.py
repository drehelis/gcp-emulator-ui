from google.cloud import datastore
import os

os.environ['DATASTORE_EMULATOR_HOST'] = 'host.docker.internal:8087'

projects = ["unbiased-staging-341814", "my-test-project-2"]
databases = ["my-test-database-1", "my-test-database-2"]
namespaces = ["my-test-namespace-1", "my-test-namespace-2"]
kind = "TestKindModel"

for project in projects:
    for database in databases:
        client = datastore.Client(project=project, database=database)
        print(f"\n--- Seeding data for Project: {client.project} | Database: {client.database} ---")
        
        for namespace in namespaces:
            _id = f"{project}.{database}.{namespace}"
            key = client.key(kind, _id, namespace=namespace)
            entity = datastore.Entity(key=key)

            entity.update({
                "project": project,
                "database": database,
                "namespace": namespace,
                "kind": kind
            })

            client.put(entity)
            print(f"Created entity in database {database} in namespace '{namespace}' with ID: {entity.key.id_or_name}")


for project in projects:
    for database in databases:
        client = datastore.Client(project=project, database=database)
        print(f"\n--- Fetching Metadata for Project: {client.project} | Database: {client.database} ---")
        for namespace in namespaces:
            query = client.query(kind=kind, namespace=namespace)
            for entity in query.fetch():
                k = entity.key
                print(f"   -> Found Entity: {k.id_or_name} in {k.database}/{k.namespace}")