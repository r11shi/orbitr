from .services.database import init_db

if __name__ == "__main__":
    print("Initialize Audit Database...")
    init_db()
    print("Done.")
