<!DOCTYPE html>
<html lang="cs">

<head>
    <meta charset="UTF-8">
</head>

<body style="margin:0;padding:0;background-color:#0F0F0F;font-family:'Inter', sans-serif;color:#F1F1F1;text-align:center;">
    <table width="100%" cellpadding="0" cellspacing="0"style="border-collapse:collapse;border:0;background-color:#0F0F0F;">
        <tr>
            <td text-align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:0;margin:30px auto;padding:20px;background-color:#0F0F0F;">
                    <tr>
                        <td text-align="center" style="padding-bottom:40px;">
                            <img src="https://iknowaspot.eu/techwatch_img/techwatch_logo_1.png" alt="TechWatch Logo" width="300" style="display:block;margin:0 auto;" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <h2 style="margin:0 0 20px 0;">Profil brzy přestane být aktivní</h2>
                            <p style="margin:0 0 20px 0;line-height:1.8;font-weight:400;">
                                    Váš režim <strong>„Hledám práci“</strong> vyprší
    <strong>{{ $user->active_worker_till->format('d.m.Y H:i') }}</strong>.<br>
                                        Pokud chcete zůstat viditelní pro nabídky práce, stačí kliknout na tlačítko níže.
                            </p>
                            <p style="margin:30px 0 30px 0;">
                                <a href="{{ $signedUrl }}" style="display:inline-block;padding:12px 32px;background-color:#B20300;color:#F1F1F1;text-decoration:none;font-size:16px;font-weight:600;border-radius:12px;">
                                    Prodloužit o 14 dní
                                </a>
                            </p>
                            <p style="margin-top:100px;font-size:12px;opacity:0.8;">
                                Pokud už práci nehledáte, můžete email ignorovat.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
