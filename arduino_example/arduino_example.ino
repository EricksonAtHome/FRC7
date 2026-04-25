/*
  FRC Systems Arduino Client
  Connects to https://frc.systems/{dataset}
  Web to https://telebey.com/auth/login
  WebiD to https://id.briskala.com/auth/login
  Model: FRC7 (Telebey) - (Briskala) - (Erickson Holding)
*/

#include <HTTPClient.h>
#include <WiFi.h>

const char *ssid = "YOUR_WIFI_SSID";
const char *password = "YOUR_WIFI_PASSWORD";
const char *frc_token = "frc_token_xxx";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    // FRC Dataset endpoint
    String dataset = "telebey_sensors";
    http.begin("https://frc.systems/" + dataset);

    http.addHeader("Authorization", "Bearer " + String(frc_token));
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.GET();

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("FRC Response: " + response);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
  delay(10000); // Wait 10 seconds
}
