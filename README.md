# shopifyzendeskop

How to setup the web app for users step by step:

1. Clone GitHub: https://github.com/excitemy/zendeskall.git
2. Create an Azure Web App: https://portal.azure.com/#create/Microsoft.WebSite
    a. for Runtime Stack choose: Node 18 LTS
    b. Under Development > Enable GitHub Actions settings
    c. Select the correct GitHub Account you just cloned to
    d. Under Monitoring > Enable Application Insights > Select Yes
3. Once App is created, visit the app.
4. Go to Configuration on left hand side
5. Create the following:
    a. Name: CORS_ORIGINS
       Value: all the Urls that will be utilized ie. https://excitemy.com/,https://excite-my.myshopify.com/,https://excitemyhelp.zendesk.com/
    b. Name: SHOPIFY_ACCESS_TOKEN
       Value: put token by following steps below
         1. visit /admin/settings/apps/development
         2. create name
         3. After adding install app
         4. On Configuration Tab for Admin API integration > check off
            read_customers, read_order_edits, read_orders, read_draft_orders, read_assigned_fulfillment_orders, read_fulfillments
         5. On API Credentials Tab > copy Admin API access token
         6. Paste that in value tab above for SHOPIFY_ACCESS_TOKEN
    c. Name: SHOPIFY_URL
       Value: your shopify store ie. excitemy.com
    d. Name: WEBAPP_NAME
       Value: whatever the webapp name is ie. zendeskall
    e. Name: ZENDESK_JWT_GUToken
       Value: put token by following steps below
         1. visit /admin/apps-integrations/apis/zendesk-api/settings/tokens
         2. Click > Add API Token
         3. Name it > ZENDESK_JWT_GUToken
         4. Copy Token
         5. Paste that in value tab above for Add API Token
    f. Name: ZENDESK_JWT_SECRET
       Value: put key by following steps below
         1. Value: visit > /admin/account/security/end_users#messaging
         2. Click create key
         3. Copy Secret
         4. Paste that in value tab above for ZENDESK_JWT_SECRET
    g. Name: ZENDESK_KEY_ID
       Value: copy > ID from step above
    h. Name: ZENDESK_JWT_SSOSECRET
       Value: Visit > /admin/account/security/sso/create-json-web-token
         1. Name: ZENDESK_JWT_SSOSECRET
         2. Remote Login Url: [ur shopify url here]/account/login
         3. Remote logout URL: [ur shopify url here]/account/logout
         4. Update of external IDs? > Set to On
         5. Shared secret > copy this
         6. Paste that in value tab above for ZENDESK_JWT_SSOSECRET
    i. Name: ZENDESK_PUBLIC_DOMAIN
       Value: set your help center public address ie. help.excitemy.com
    j. Name: ZENDESK_SUB_DOMAIN
       Value: set your zendesk sub domain ie. excitemyhelp
    k. Name: ZENDESK_USERNAME
       Valeu: set with an admin emaill address ie. g2@excitemy.com
    l. add info about how to get OAuth ({{baseUrl}}/api/v2/oauth/clients.json)
6. Send End User Authentication in Zendesk
    a. Visit > /admin/account/security/end_users
    b. Check off > External authentication
    c. Click the name > ZENDESK_JWT_SSOSECRET
    d. Set for How end users sign in > Redirect to SSO
7. Copy code from theme.liquid here
    a. to shopify go to themes > edit code > theme.liquid
    b. paste the code before </body></html>
    c. make sure to replace var WebAppName = "zendeskall"; // !!!Replace with your main web app name!!!
8. Copy header.hbs file to left
    a. go to zendesk /theming/workbench
    b. download your theme
    c. find the header.hbs file located in the templates folder
    c. paste it before the </header>
    d. make sure to replace var WebAppName = "zendeskall"; // !!!Replace with your main web app name!!!
    e. zip the file
    f. import the them and set it to live

Congrats now test!!

