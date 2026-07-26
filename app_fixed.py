from flask import Flask, request, send_from_directory, jsonify
import psycopg2

app = Flask(__name__)


# ==========================
# DATABASE CONNECTION
# ==========================
def get_db_connection():
    return psycopg2.connect(
        host="dpg-d9iiniflk1mc73d52dp0-a.virginia-postgres.render.com",
        database="techfarm_db",
        user="techfarm_db_user",
        password="qbZt6HzYeWp0ZQ2vkGWajfkQwTOfd146",
        port="5432"
    )

# ==========================
# CREATE TABLES
# ==========================

def create_tables():

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS location_submissions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            phone VARCHAR(20),
            latitude DECIMAL(10,8),
            longitude DECIMAL(11,8),
            address TEXT,
            photo TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()

    cur.close()
    conn.close()
# ==========================
# STATIC FILE ROUTES
# ==========================

@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/style.css")
def style():
    return send_from_directory(".", "style.css")


@app.route("/login.css")
def login_css():
    return send_from_directory(".", "login.css")


@app.route("/script.js")
def script():
    return send_from_directory(".", "script.js")


@app.route("/images/<path:filename>")
def images(filename):
    return send_from_directory("images", filename)


@app.route("/videos/<path:filename>")
def videos(filename):
    return send_from_directory("videos", filename)


# ==========================
# PAGES
# ==========================

@app.route("/login.html")
def login_page():
    return send_from_directory(".", "login.html")


@app.route("/locationTracking.html")
def location_tracking():
    return send_from_directory(".", "locationTracking.html")


# ==========================
# SIGNUP
# ==========================

@app.route("/signup", methods=["POST"])
def signup():

    try:

        name = request.form["name"]
        mobile = request.form["mobile"]
        email = request.form["email"]
        company = request.form["company"]
        password = request.form["password"]

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO users
            (
                full_name,
                mobile_number,
                email,
                company_name,
                password
            )
            VALUES (%s, %s, %s, %s, %s)
        """,
        (
            name,
            mobile,
            email,
            company,
            password
        ))

        conn.commit()

        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Account Created Successfully"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ==========================
# LOCATION SAVE API
# ==========================

@app.route("/save-location", methods=["POST"])
def save_location():

    try:

        data = request.get_json()

        name = data.get("name")
        phone = data.get("phone")
        latitude = data.get("lat")
        longitude = data.get("lon")
        address = data.get("address")
        photo = data.get("photo")

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO location_submissions
            (
                name,
                phone,
                latitude,
                longitude,
                address,
                photo
            )
            VALUES (%s,%s,%s,%s,%s,%s)
        """,
        (
            name,
            phone,
            latitude,
            longitude,
            address,
            photo
        ))

        conn.commit()

        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Location Saved Successfully"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ==========================
# ADMIN LOCATION VIEW
# ==========================

@app.route("/admin.html")
def admin_page():
    return send_from_directory(".", "admin.html")

    try:

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                id,
                name,
                phone,
                latitude,
                longitude,
                address,
                photo,
                created_at
            FROM location_submissions
            ORDER BY id DESC
        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        data = []

        for row in rows:
            data.append({
                "id": row[0],
                "name": row[1],
                "phone": row[2],
                "latitude": float(row[3]),
                "longitude": float(row[4]),
                "address": row[5],
                "photo": row[6],
                "created_at": str(row[7]),
                
            })

        return jsonify(data)

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/test")
def test():
    return "TEST OK"

@app.route("/admin-locations")
def admin_locations():

    try:

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                id,
                name,
                phone,
                photo,
                latitude,
                longitude,
                address,
                created_at
            FROM location_submissions
            ORDER BY id DESC
        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        data = []

        for row in rows:

            data.append({
                "id": row[0],
                "name": row[1],
                "phone": row[2],
                "photo": row[3],
                "latitude": float(row[4]),
                "longitude": float(row[5]),
                "address": row[6],
                "created_at": str(row[7])
            })

        return jsonify(data)

    except Exception as e:
         
            print("ADMIN ERROR:", e)  # ADD THIS50 
            return jsonify({
                "success": False,
                            "error": str(e)
                                    }), 500
# ==========================
# RUN APP
# ==========================

create_tables()

if __name__ == "__main__":
    app.run(debug=True)
