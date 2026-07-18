from flask import Flask, request, send_from_directory
import psycopg2

app = Flask(__name__)

@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/signup", methods=["POST"])
def signup():

    name = request.form["name"]
    mobile = request.form["mobile"]
    email = request.form["email"]
    company = request.form["company"]
    password = request.form["password"]

    try:

        conn = psycopg2.connect(
            database="Techfarm_db",
            user="postgres",
            password="TechFarm@123",
            host="localhost",
            port="5433"
        )

        cur = conn.cursor()

        cur.execute("""
            INSERT INTO users
            (full_name, mobile_number, email, company_name, password)
            VALUES (%s, %s, %s, %s, %s)
        """,
        (name, mobile, email, company, password))

        conn.commit()

        cur.close()
        conn.close()

        return "Account Created Successfully ✅"

    except Exception as e:
        return str(e)


if __name__ == "__main__":
    app.run(debug=True)