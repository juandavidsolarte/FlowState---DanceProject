from django.core.management.base import BaseCommand
from faker import Faker
from apps.users.models import User

fake = Faker("es_CO")


class Command(BaseCommand):
    help = "Genera usuarios de prueba"

    def add_arguments(self, parser):
        parser.add_argument(
            "--total",
            type=int,
            default=100,
            help="Cantidad de usuarios a crear"
        )

    def handle(self, *args, **options):

        total = options["total"]

        creados = 0

        for _ in range(total):

            email = fake.unique.email()

            if User.objects.filter(email=email).exists():
                continue

            User.objects.create_user(
                email=email,
                password="Password123!",
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                phone=fake.phone_number(),
                country=fake.country(),
                role=User.Role.CLIENTE,
            )

            creados += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"Usuario creado: {email}"
                )
            )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Se crearon {creados} usuarios correctamente."
            )
        )