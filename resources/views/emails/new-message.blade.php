<!DOCTYPE html>
<html lang="cs" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <style>
        /* Totální likvidace barev v Outlooku */
        a, a:visited { color: #F1F1F1 !important; text-decoration: none !important; }
        .button-link:visited { color: #F1F1F1 !important; }
        span.MsoHyperlinkFollowed { color: #F1F1F1 !important; }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#0F0F0F;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#0F0F0F">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#0F0F0F" style="width:600px;">
                    <tr>
                        <td align="center" style="padding-bottom:40px;">
                            <img src="https://pub-263296a03d7d4d0fad026af20f628ecb.r2.dev/website/techwatch_logo_1.png" alt="TechWatch" width="300" style="display:block; border:0; width:300px;">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 40px; color: #F1F1F1; font-family: 'Segoe UI', Arial, sans-serif;">
                            <h2 style="font-size: 24px; margin: 0 0 20px 0; font-weight: 700;">Máte novou zprávu!</h2>
                            
                            <p style="font-size: 16px; margin: 0 0 40px 0; line-height: 1.6; font-weight: 500; color: #F1F1F1;">
                                @if(isset($notification->data['tech_id']) && $notification->data['tech_id'])
                                    <strong>{{ $senderName }}</strong> má zájem o
                                    <strong>{{ $notification->tech_info['title'] ?? 'Vaši techniku' }}</strong>.
                                @elseif(isset($notification->data['is_job_offer']) && $notification->data['is_job_offer'])
                                    <strong>{{ $senderName }}</strong> Vám posílá pracovní nabídku.
                                @else
                                    <strong>{{ $senderName }}</strong> Vám posílá zprávu.
                                @endif
                            </p>
                            
                            <table border="0" cellspacing="0" cellpadding="0" role="presentation" align="center">
                                <tr>
                                    <td align="center" bgcolor="#B20300" style="border-radius: 12px; background-color: #B20300; padding: 15px 35px;">
                                        <a href="{{ $link }}" target="_blank" style="font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #F1F1F1; text-decoration: none; display: inline-block; background-color: #B20300;">
                                            <span style="color: #F1F1F1; text-decoration: none !important;">Zobrazit zprávu v aplikaci</span>
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin-top:80px; font-size: 12px; color: #AAAAAA; line-height: 1.5;">
                                Toto je automatické oznámení z aplikace <a href="https://techwatch.app/" style="color:#F1F1F1; text-decoration:none; font-weight: bold;">TechWatch</a>.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>