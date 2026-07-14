from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
driver.get("http://localhost:5173")

# 1. Hacer clic en "Accede" del Navbar
# Usamos XPath para buscar el botón por su texto exacto
boton_acceder_navbar = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Accede')]"))
)
boton_acceder_navbar.click()

# 2. Esperar a que el formulario (modal) aparezca
# Aquí Selenium espera hasta 10 segundos a que el input con name="email" sea visible
email_field = WebDriverWait(driver, 10).until(
    EC.visibility_of_element_located((By.NAME, "email"))
)

# 3. Escribir y enviar
email_field.send_keys("juandasolarte99@gmail.com")
#  campo de contraseña,
driver.find_element(By.NAME, "password").send_keys("Mazdacx30$")

# 4. Hacer clic en el botón de submit del formulario
driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

# 2. ESPERA INTELIGENTE: Espera hasta 15 segundos a que aparezca un elemento que solo existe 
# cuando ya estás logueado (por ejemplo, el botón de "Cerrar sesión" o tu nombre en el perfil)
try:
    wait = WebDriverWait(driver, 15) # Aumentamos a 15 segundos
    # Cambia 'logout-button' por el ID o selector de algo que aparezca tras el login
    elemento_exito = wait.until(EC.visibility_of_element_located((By.ID, "logout-button")))
    print("¡Inicio de sesión exitoso!")
except Exception as e:
    print("La prueba falló: no se pudo encontrar el elemento de éxito.")
    # Esto te ayuda a ver qué pasó antes de que se cierre
    print(f"Error detallado: {e}")

# 5. Confirmar navegación
time.sleep(2)
print("Prueba completada. Estás en:", driver.current_url)

driver.quit()