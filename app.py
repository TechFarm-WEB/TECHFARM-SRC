from flask import Flask, request, send_from_directory, jsonify, session, redirect
import psycopg2 ,requests


app = Flask(__name__)
app.secret_key = "techfarm_admin_secret"

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


def get_address_from_coordinates(lat, lon):

    try:

        url = (
            f"https://nominatim.openstreetmap.org/reverse"
                f"?format=jsonv2&lat={lat}&lon={lon}"
        )

        response = requests.get(
            url,
            headers={
                "User-Agent": "TechFarm"
            },
            timeout=10
        )

        data = response.json()

        return data.get(
            "display_name",
            "Address Not Found"
        )

    except Exception:

        return "Address Not Found"
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

    cur.execute("""

        CREATE TABLE IF NOT EXISTS milk_orders (

            id SERIAL PRIMARY KEY,

            order_id VARCHAR(50),

            customer_name VARCHAR(100),

            customer_mobile VARCHAR(20),

            customer_address TEXT,

            payment_method VARCHAR(50),

            items TEXT,

            total_amount DECIMAL(10,2),

            status VARCHAR(100)
            DEFAULT 'Awaiting Delivery Partner Assignment',

            delivery_partner_name VARCHAR(100),

            delivery_address TEXT,

            delivery_partner_phone VARCHAR(20),

            created_at TIMESTAMP
            DEFAULT CURRENT_TIMESTAMP

        )

    """)

    cur.execute("""
       CREATE TABLE IF NOT EXISTS inventory_products (

    id SERIAL PRIMARY KEY,

    product_name VARCHAR(200),

    stock INTEGER DEFAULT 0,

    price NUMERIC(10,2),

    category VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)

""")





    conn.commit()

    cur.close()

    conn.close()

@app.route("/seed-inventory")
def seed_inventory():

    conn = get_db_connection()
    cur = conn.cursor()

    products = [

    ("Amul Gold 500ml",100,35,"Milk"),
    ("Amul Gold 1L",100,70,"Milk"),

    ("Amul Taaza 500ml",100,30,"Milk"),
    ("Amul Taaza 1L",100,60,"Milk"),

    ("Amul Cow Milk 500ml",100,32,"Milk"),
    ("Amul Cow Milk 1L",100,64,"Milk"),

    ("Mother Dairy Full Cream 500ml",100,34,"Milk"),
    ("Mother Dairy Full Cream 1L",100,68,"Milk"),

    ("Mother Dairy Toned Milk 500ml",100,30,"Milk"),
    ("Mother Dairy Toned Milk 1L",100,60,"Milk"),

    ("Sanchi Gold 500ml",100,34,"Milk"),
    ("Sanchi Gold 1L",100,68,"Milk"),

    ("Sanchi Standard Milk 500ml",100,32,"Milk"),
    ("Sanchi Standard Milk 1L",100,64,"Milk"),

    ("Sanchi Toned Milk 500ml",100,30,"Milk"),
    ("Sanchi Toned Milk 1L",100,60,"Milk"),

    ("Sudhamrit Gold 500ml",100,34,"Milk"),
    ("Sudhamrit Gold 1L",100,68,"Milk"),

    ("Sudhamrit Toned Milk 500ml",100,30,"Milk"),
    ("Sudhamrit Toned Milk 1L",100,60,"Milk")

]

    for p in products:

        cur.execute("""
            INSERT INTO inventory_products
            (
                product_name,
                stock,
                price,
                category
            )
            VALUES(%s,%s,%s,%s)
        """, p)

    conn.commit()

    cur.close()
    conn.close()

    return "Inventory Seeded"



@app.route("/inventory-list")
def inventory_list():

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            product_name,
            stock,
            price,
            category
        FROM inventory_products
        ORDER BY product_name
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    data=[]

    for row in rows:

        data.append({

            "id":row[0],
            "name":row[1],
            "stock":row[2],
            "price":float(row[3]),
            "category":row[4]

        })

    return jsonify(data)








@app.route("/shop-products")
def shop_products():

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            product_name,
            stock,
            price,
            category
        FROM inventory_products
        ORDER BY product_name
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    data = []

    for row in rows:

        data.append({
            "id": row[0],
            "name": row[1],
            "stock": row[2],
            "price": float(row[3]),
            "category": row[4]
        })

    return jsonify(data)




@app.route("/update-inventory", methods=["POST"])
def update_inventory():

    try:

        data=request.get_json()

        conn=get_db_connection()
        cur=conn.cursor()   

        cur.execute("""

            UPDATE inventory_products

            SET stock=%s

            WHERE id=%s

        """,

        (
            data["stock"],
            data["id"]
        ))

        conn.commit()

        cur.close()
        conn.close()

        return jsonify({
            "success":True
        })

    except Exception as e:

        return jsonify({
            "success":False,
            "error":str(e)
        })
    
@app.route("/place-order", methods=["POST"])
def place_order():

    try:

        data = request.get_json()

        print("ORDER DATA RECEIVED:", data)

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO milk_orders(
                order_id,
                customer_name,
                customer_mobile,
                customer_address,
                payment_method,
                items,
                total_amount
            )
            VALUES(%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            data.get("orderId"),
            data.get("customerName"),
            data.get("customerMobile"),
            data.get("customerAddress"),
            data.get("paymentMethod"),
            data.get("items"),
            data.get("total")
        ))

        conn.commit()

        print("ORDER SAVED:", data.get("orderId"))

        cur.close()
        conn.close()

        return jsonify({
            "success": True
        })

    except Exception as e:

        print("PLACE ORDER ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
# ==========================
# STATIC FILE ROUTES
# ==========================

@app.route("/admin-orders")
def admin_orders():

    try:

        conn = get_db_connection()

        cur = conn.cursor()

        cur.execute("""

            SELECT

                id,

                order_id,

                customer_name,

                customer_mobile,

                customer_address,

                payment_method,

                total_amount,

                status,

                created_at

            FROM milk_orders

            ORDER BY id DESC

        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        data=[]

        for row in rows:

            data.append({

                "id":row[0],

                "order_id":row[1],

                "customer_name":row[2],

                "customer_mobile":row[3],

                "customer_address":row[4],

                "payment_method":row[5],

                "total_amount":float(row[6]),

                "status":row[7],

                "created_at":str(row[8])

            })

        return jsonify(data)

    except Exception as e:

        return jsonify({

            "success":False,

            "error":str(e)

        }),500

@app.route("/assign-partner", methods=["POST"])
def assign_partner():

    try:

        data = request.get_json()

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""

            UPDATE milk_orders

            SET

                delivery_partner_name=%s,
                delivery_partner_phone=%s,
                status='Assigned'

            WHERE id=%s

        """,

        (
            data["partner_name"],
            data["partner_phone"],
            data["id"]
        ))

        conn.commit()

        cur.close()
        conn.close()

        return jsonify({
            "success": True
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }),500

@app.route("/Architeshop.html")
def archit_eshop():
    return send_from_directory(".", "Architeshop.html")



@app.route("/admin")
def admin_dashboard():

    if not session.get("admin_logged_in"):
        return redirect("/admin-login")
    
    return send_from_directory(
        "Admin Panel",
        "admin.html"
    )

@app.route("/admin-logout")
def admin_logout():

    session.pop(
        "admin_logged_in",
        None
    )

    return jsonify({
        "success": True
    })



@app.route("/admin.css")
def admin_css():

    return send_from_directory(

        "Admin Panel",

        "admin.css"

    )
@app.route("/admin.js")
def admin_js():

    return send_from_directory(

        "Admin Panel",

        "admin.js"

    )


@app.route("/admin-login")
def admin_login():

    return send_from_directory(

        "Admin Panel",

        "adminLogin.html"

    )

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

@app.route("/admin.html")
def admin_html():
    return send_from_directory(
        "Admin Panel",
        "admin.html"
    )


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

# @app.route("/admin.html")
# def admin_page():
#     return send_from_directory(".", "admin.html")

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
                "latitude": float(row[4]) if row[4] is not None else None,
                "longitude": float(row[5]) if row[5] is not None else None,
                "address": row[6],
                "created_at": str(row[7])
            })

        return jsonify(data)

    except Exception as e:
        print("ADMIN ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
# ==========================
# RUN APP
# ==========================

@app.route("/assign-test")
def assign_test():

    return "ASSIGN ROUTE WORKING"



@app.route("/order-status/<order_id>")
def order_status(order_id):

    try:

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                order_id,
                status,
                delivery_partner_name,
                delivery_partner_phone
            FROM milk_orders
            WHERE order_id=%s
        """, (order_id,))

        row = cur.fetchone()

        cur.close()
        conn.close()

        if not row:

            return jsonify({
                "success": False
            })

        return jsonify({
            "success": True,
            "order_id": row[0],
            "status": row[1],
            "partner_name": row[2],
            "partner_phone": row[3]
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/real-delivery-orders")
def real_delivery_orders():

    try:

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                id,
                order_id,
                customer_name,
                delivery_partner_name,
                status,
                delivery_address
            FROM milk_orders
            WHERE delivery_partner_name IS NOT NULL
            ORDER BY id DESC
        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        data = []

        for row in rows:

            data.append({
                "id": row[0],
                "order_id": row[1],
                "customer_name": row[2],
                "driver_name": row[3],
                "status": row[4],
                "delivery_address": row[5]
            })

        return jsonify(data)

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/assigned-orders")
def assigned_orders():

    try:

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                id,
                order_id,
                customer_name,
                customer_mobile,
                customer_address,
                delivery_partner_name,
                delivery_partner_phone,
                status
            FROM milk_orders
            WHERE status='Assigned'
            ORDER BY id DESC
        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        data = []

        for row in rows:

            data.append({
                "id": row[0],
                "order_id": row[1],
                "customer_name": row[2],
                "customer_mobile": row[3],
                "customer_address": row[4],
                "partner_name": row[5],
                "partner_phone": row[6],
                "status": row[7]
            })

        return jsonify(data)

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500





@app.route("/mark-delivered/<order_id>", methods=["POST"])
def mark_delivered(order_id):

    try:

        data = request.get_json()
        print("RECEIVED DATA:", data)
        latitude = data.get("latitude")

        longitude = data.get("longitude")

        address = data.get("address")

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            UPDATE milk_orders
            SET status='Delivered',
            delivery_address=%s
            WHERE order_id=%s
        """, (address, order_id))
        

        # REDUCE INVENTORY AFTER DELIVERY

        cur.execute("""
            SELECT items
            FROM milk_orders
            WHERE order_id=%s
        """, (order_id,))

        row = cur.fetchone()

        if row:

            import json

            products = json.loads(row[0])

            for p in products:

                cur.execute("""
                    UPDATE inventory_products
                    SET stock = stock - 1
                    WHERE product_name=%s
                """, (p["name"],))

        conn.commit()

        cur.close()
        conn.close()

        return jsonify({
            "success": True
        })

    except Exception as e:
        print("================================")
        print("MARK DELIVERED ERROR")
        print(str(e))
        print("================================")

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
       

@app.route("/add-delivery-address-column")
def add_delivery_address_column():

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""

        ALTER TABLE milk_orders

        ADD COLUMN delivery_address TEXT

    """)

    conn.commit()

    cur.close()
    conn.close()

    return "DELIVERY ADDRESS COLUMN ADDED"

@app.route("/admin-login-api", methods=["POST"])
def admin_login_api():

    data = request.get_json()

    admin_name = data.get("adminName")
    phone_number = data.get("phoneNumber")

    if (
        admin_name == "Gaurav"
        and
        phone_number == "9653246475"
    ):

        session["admin_logged_in"] = True

        print("LOGIN SUCCESS")
        print(session)

        return jsonify({
            "success": True
        })

    return jsonify({
        "success": False,
        "message": "Invalid Credentials"
    })


@app.route("/adminLogin.css")
def admin_login_css():

    return send_from_directory(
        "Admin Panel",
        "adminLogin.css"
    )

@app.route("/adminLogin.js")
def admin_login_js():

    return send_from_directory(
        "Admin Panel",
        "adminLogin.js"
    )

@app.route("/fix-db")
def fix_db():

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        ALTER TABLE milk_orders
        ADD COLUMN customer_address TEXT
    """)

    conn.commit()

    cur.close()
    conn.close()

    return "DONE"


create_tables()

if __name__ == "__main__":
    app.run(debug=True)