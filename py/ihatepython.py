import mysql.connector

mydb = mysql.connector.connect(
  host="localhost",
  user="root",
  passwd="",
  database="iot"
)

#print(mydb)
#mycursor = mydb.cursor()
mycursor = mydb.cursor(prepared = True)
print("read or write")
op = input()
if op == "write":
  reading_val = input()
  reading_val = float(reading_val)
  mycursor.execute("INSERT INTO readings (reading_value) VALUES (%f)" %reading_val)
  mydb.commit()

elif op == "read":
  mycursor.execute("SELECT * FROM actuators")
  myresult = mycursor.fetchall()
  for x in myresult:
    print(x)
else:
	print("Invalid operation")