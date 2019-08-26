import RPi.GPIO as GPIO
import mysql.connector
import time


mydb = mysql.connector.connect(
  host="10.10.10.7",
  user="rpi",
  passwd="",
  database="productmanagement"
)

mycursor = mydb.cursor()

LEDPin = 11
buttonPin = 5

inf = 1;
GPIO.setmode(GPIO.BOARD)  
#Set pin for LED
GPIO.setup(LEDPin, GPIO.OUT)
#Set pin for Button
#GPIO.setup(buttonPin, GPIO.IN, pull_up_down = GPIO.PUD_UP) #we will use GPIO 5 for the switch signal

#to keep track of states and initialize
buttonPress = True
ledState = False
counter = 0
while inf > 0:
	buttonPress = GPIO.input(buttonPin)
	if buttonPress == False and ledState == False:
		mycursor.execute("UPDATE switch SET switch ='1' WHERE switch.switch = 0")
		GPIO.output(LEDPin, True)
		print("Switch detected, setting LED to ON")
		time.sleep(1) #limited to 1 second per iteration to save resources since this is a pretty stupid way to go about this
		buttonPress = True
		ledState = True
		mycursor.execute("UPDATE switch SET switch ='0' WHERE switch.switch = 1")
		continue
	mycursor.execute("SELECT * FROM switch")
	myresult = mycursor.fetchone()
	if myresult[0] == 0:
		print("LED Off.")
		GPIO.output(LEDPin, False)
		ledState = False
		time.sleep(1) #limited to 1 second per iteration to save resources since this is a pretty stupid way to go about this
	else:
		print("LED On.")
		GPIO.output(LEDPin, True)
		ledState = True
		time.sleep(1) #limited to 1 second per iteration to save resources since this is a pretty stupid way to go about this
GPIO.cleanup()
