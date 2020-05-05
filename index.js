addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

const url = 'https://cfw-takehome.developers.workers.dev/api/variants';

/**Use of cookies
 * Handles case for A/B testing
 * @param {request} request incoming Request
 */
async function handleRequest(request)
{
    try
    {
        let response
        const NAME = 'experiment-ab'
        //https://developers.cloudflare.com/workers/templates/
        const cookie = request.headers.get('cookie');
        if (cookie && cookie.includes(`${NAME}=response_a`)) {
            response = await get_response('response_a');
        } else if (cookie && cookie.includes(`${NAME}=response_b`)) {
            response = await get_response('response_b');
        } else {
            // if no cookie then this is a new client, decide a group and set the cookie
            let group = Math.random() < 0.5 ? 'response_a' : 'response_b'
            response = await get_response(group);
            response.headers.append('Set-Cookie', `${NAME}=${group}; path=/`)
        }
        return response;
    }
    catch (error) {
        //https://developers.cloudflare.com/workers/archive/writing-workers/handling-errors/
        return new Response('Something went wrong, please try again', {
            status: 500,
        })
    }
}

/**
 * Returns appropriate response for existing cookie user or new user without a cookie
 * @param {group} identifier for response website
 */
async function get_response(group) {
    // Get url json response array
    let response_promise = await fetch(url);
    url_json_data = await response_promise.json();

    let response_url
    if(group === 'response_a') {
        response_url = url_json_data['variants'][0];
    }
    else{
        response_url = url_json_data['variants'][1];
    }

    // Get html from selected website variant
    random_site_variant_promise = await fetch(response_url);
    random_site_html = await random_site_variant_promise;

    //Extra credit
    // Transform html with cloudfare's HTMLRewriter
    let newResponse = await transform_html(random_site_html);

    return newResponse;
}


/**
 * Transforms the html attributes and returns it
 * @param {site_html} the webpage html that is to be transformed
 */
async function transform_html(site_html) {
        transformed_resp = new HTMLRewriter()
            .on('title', {
                element(element) {
                    element.setInnerContent('summer intern project')
                },
            })
            .on('h1#title', {
                element(element) {
                    element.setInnerContent('Hello!')
                },
            })
            .on('p#description', {
                element(element) {
                    element.setInnerContent('I am Sumant, I enjoyed doing this assignment. To know more..')
                },
            })
            .on('a#url', {
                element(element) {
                    element.setAttribute('href', 'https://www.linkedin.com/in/sumantgaopande/')
                    element.setInnerContent('You can check my LinkedIn profile here')
                },
            })
            .transform(site_html);

        return transformed_resp;
}
