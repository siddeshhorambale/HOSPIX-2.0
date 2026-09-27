import sqlite3

def migrate():
    con = sqlite3.connect('hospix.db')
    cur = con.cursor()
    
    cols_b = [col[1] for col in cur.execute('PRAGMA table_info(bookings)').fetchall()]
    print("Existing bookings columns:", cols_b)
    if 'requirement_id' not in cols_b:
        cur.execute('ALTER TABLE bookings ADD COLUMN requirement_id INTEGER REFERENCES requirements(id)')
        print("Added requirement_id to bookings")
    if 'start_time' not in cols_b:
        cur.execute('ALTER TABLE bookings ADD COLUMN start_time TEXT DEFAULT "10:00"')
        print("Added start_time to bookings")
    if 'end_time' not in cols_b:
        cur.execute('ALTER TABLE bookings ADD COLUMN end_time TEXT DEFAULT "22:00"')
        print("Added end_time to bookings")

    cols_r = [col[1] for col in cur.execute('PRAGMA table_info(resource_requests)').fetchall()]
    print("Existing resource_requests columns:", cols_r)
    if 'start_time' not in cols_r:
        cur.execute('ALTER TABLE resource_requests ADD COLUMN start_time TEXT DEFAULT "10:00"')
        print("Added start_time to resource_requests")
    if 'end_time' not in cols_r:
        cur.execute('ALTER TABLE resource_requests ADD COLUMN end_time TEXT DEFAULT "22:00"')
        print("Added end_time to resource_requests")

    con.commit()
    con.close()
    print("Migration successful!")

if __name__ == '__main__':
    migrate()
