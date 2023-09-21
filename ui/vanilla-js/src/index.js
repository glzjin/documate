// Ask AI
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

import MarkdownIt from 'markdown-it';
import MarkdownItHighlightjs from 'markdown-it-highlightjs';

// markdown processor
const markdownToHtml = (content) => {
  const markdown = new MarkdownIt()
    .use(MarkdownItHighlightjs);

  try {
    const html = markdown.render(content);
    return html;
  } catch (err) {
    return content;
  }
};

(async () => {
  let askAI;
  do {
    // eslint-disable-next-line no-await-in-loop
    await sleep(10);
    askAI = document.getElementById('ask-ai');
  } while(!askAI);

  function showDialog() {
    let mask = document.querySelector('.documate-dialog');
    if(mask) {
      return;
    }

    mask = document.createElement('div');
    mask.className = 'documate-dialog';
    document.body.appendChild(mask);

    const panel = document.createElement('div');
    panel.className = 'dialog-panel';
    mask.appendChild(panel);

    panel.innerHTML = `<div class="chat-container"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="magnifying-glass-icon" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"></path></svg><input value="" aria-expanded="false" aria-autocomplete="false" id="headlessui-combobox-input-12" role="combobox" type="text" tabindex="0" class="chat-input" placeholder="Ask a question..." autocomplete="off"></div><div  static="" class="combobox-options"><ul class="question-anwser-section"><li class="loading-item"><div  class="loading" style="display: none;"><svg  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="loading-spin"><path  stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"></path></svg></div></li></ul></div><div  class="footer"><div  class="kbd-wrap"><span  class="kbd-text">Type</span><kbd  class="kbd">⌘</kbd><span  class="kbd-text">+</span><kbd  class="kbd">/</kbd><span  class="kbd-text">to open</span><kbd  class="kbd esc">esc</kbd><span  class="kbd-text">to close</span></div><a  href="https://documate.site/" class="powered-by"><span >Powered by</span><svg  width="100" height="18" viewBox="0 0 240 46" fill="none" xmlns="http://www.w3.org/2000/svg"><path  fill-rule="evenodd" clip-rule="evenodd" d="M7.72224 46.8237C7.2755 46.7799 6.8307 46.7181 6.38892 46.6386C6.06446 46.5805 5.76104 46.4379 5.50921 46.2252C5.25739 46.0125 5.06605 45.7372 4.95446 45.427C4.84287 45.1168 4.81497 44.7827 4.87356 44.4584C4.93216 44.134 5.07519 43.8308 5.28824 43.5792C6.31452 42.3694 7.01535 40.9178 7.32449 39.3617C7.38203 39.074 7.26946 38.5687 6.6891 38.0033C2.56157 33.9883 0 28.5425 0 22.5138C0 9.93109 11.0768 0 24.39 0C37.7031 0 48.7799 9.93109 48.7799 22.5138C48.7799 35.0965 37.7031 45.0276 24.39 45.0276C22.3062 45.0276 20.2799 44.785 18.3438 44.3297C15.1789 46.3186 11.4415 47.1962 7.72224 46.8237ZM26.0073 36.1273C25.9152 36.2256 25.7937 36.2748 25.643 36.2748C25.4922 36.2748 25.3666 36.2256 25.2661 36.1273C25.1739 36.0372 25.1153 35.9185 25.0902 35.771C24.9143 34.4768 24.7216 33.3915 24.5123 32.515C24.3029 31.6387 24.0265 30.9261 23.6831 30.3772C23.3397 29.8203 22.8832 29.3779 22.3136 29.0503C21.7525 28.7227 21.028 28.4606 20.1401 28.264C19.2523 28.0592 18.1593 27.8749 16.8611 27.7111C16.7019 27.6947 16.5721 27.6373 16.4716 27.539C16.3711 27.4407 16.3208 27.3179 16.3208 27.1705C16.3208 27.023 16.3711 26.9002 16.4716 26.8019C16.5721 26.7036 16.7019 26.6463 16.8611 26.6298C18.1677 26.4906 19.2649 26.3309 20.1527 26.1507C21.0405 25.9623 21.7692 25.7002 22.3388 25.3644C22.9083 25.0286 23.3648 24.5781 23.7082 24.0129C24.06 23.4477 24.3364 22.7228 24.5374 21.8382C24.7468 20.9536 24.931 19.8601 25.0902 18.5578C25.1153 18.4185 25.1739 18.3038 25.2661 18.2137C25.3666 18.1154 25.4922 18.0663 25.643 18.0663C25.7937 18.0663 25.9152 18.1154 26.0073 18.2137C26.1078 18.3038 26.1706 18.4185 26.1958 18.5578C26.3633 19.8601 26.5475 20.9536 26.7486 21.8382C26.9579 22.7228 27.2343 23.4477 27.5777 24.0129C27.9211 24.5781 28.3776 25.0286 28.9472 25.3644C29.5167 25.7002 30.2454 25.9623 31.1333 26.1507C32.0294 26.3309 33.1267 26.4906 34.4249 26.6298C34.584 26.6463 34.7096 26.7036 34.8017 26.8019C34.9022 26.9002 34.9525 27.023 34.9525 27.1705C34.9525 27.3179 34.9022 27.4407 34.8017 27.539C34.7096 27.6373 34.584 27.6947 34.4249 27.7111C33.1267 27.8504 32.0294 28.0141 31.1333 28.2025C30.2454 28.3828 29.5167 28.6408 28.9472 28.9766C28.3776 29.3125 27.9211 29.7629 27.5777 30.328C27.2343 30.8934 26.9579 31.6182 26.7486 32.5028C26.5475 33.3875 26.3633 34.4768 26.1958 35.771C26.1706 35.9185 26.1078 36.0372 26.0073 36.1273ZM17.841 23.288C17.774 23.3535 17.6903 23.3863 17.5897 23.3863C17.372 23.3863 17.2464 23.2716 17.2129 23.0423C17.1207 22.2641 17.0202 21.658 16.9113 21.2239C16.8024 20.7816 16.6349 20.4499 16.4088 20.2287C16.1826 20.0075 15.8351 19.8396 15.366 19.725C14.9053 19.6103 14.273 19.4833 13.4689 19.3441C13.2177 19.3113 13.092 19.1925 13.092 18.9878C13.092 18.7912 13.2009 18.6724 13.4187 18.6315C14.2395 18.484 14.8802 18.353 15.3409 18.2383C15.8099 18.1154 16.1617 17.9475 16.3962 17.7346C16.6307 17.5134 16.8024 17.1858 16.9113 16.7517C17.0202 16.3175 17.1207 15.7155 17.2129 14.9456C17.2464 14.7162 17.372 14.6015 17.5897 14.6015C17.8075 14.6015 17.929 14.7121 17.9541 14.9333C18.063 15.7196 18.1719 16.338 18.2808 16.7885C18.3896 17.2308 18.5571 17.5667 18.7833 17.796C19.0178 18.0172 19.3654 18.1851 19.8261 18.2997C20.2951 18.4062 20.94 18.5168 21.7608 18.6315C21.853 18.6479 21.9284 18.6888 21.987 18.7543C22.054 18.8117 22.0875 18.8895 22.0875 18.9878C22.0875 19.1925 21.9786 19.3113 21.7608 19.3441C20.94 19.4997 20.2993 19.639 19.8386 19.7618C19.378 19.8847 19.0304 20.0567 18.7959 20.2778C18.5613 20.4908 18.3896 20.8143 18.2808 21.2485C18.1719 21.6744 18.063 22.2764 17.9541 23.0546C17.9457 23.1447 17.908 23.2225 17.841 23.288ZM23.6202 15.2036C23.5867 15.351 23.503 15.4247 23.369 15.4247C23.2182 15.4247 23.1345 15.351 23.1177 15.2036C23.0004 14.5892 22.8915 14.1388 22.791 13.8521C22.6989 13.5572 22.5021 13.3483 22.2006 13.2255C21.9074 13.1026 21.4133 12.9838 20.7181 12.8692C20.5673 12.8364 20.4919 12.7545 20.4919 12.6234C20.4919 12.476 20.5673 12.3941 20.7181 12.3777C21.4133 12.2548 21.9074 12.1361 22.2006 12.0214C22.5021 11.8985 22.6989 11.6938 22.791 11.4071C22.8915 11.1122 23.0004 10.6535 23.1177 10.031C23.1345 9.88357 23.2182 9.80985 23.369 9.80985C23.503 9.80985 23.5867 9.88357 23.6202 10.031C23.7291 10.6535 23.8338 11.1122 23.9343 11.4071C24.0348 11.6938 24.2317 11.8985 24.5248 12.0214C24.818 12.1361 25.3121 12.2548 26.0073 12.3777C26.1581 12.3941 26.2335 12.476 26.2335 12.6234C26.2335 12.7545 26.1581 12.8364 26.0073 12.8692C25.3121 12.9838 24.818 13.1026 24.5248 13.2255C24.2317 13.3483 24.0348 13.5572 23.9343 13.8521C23.8338 14.1388 23.7291 14.5892 23.6202 15.2036Z" fill="#374151"></path><path  d="M66.5693 37.5231V12.3076H76.4394C78.2405 12.3076 79.8615 12.6078 81.3024 13.2082C82.7673 13.8085 84.016 14.6731 85.0487 15.8018C86.0813 16.9305 86.8738 18.2633 87.4261 19.8002C87.9785 21.3372 88.2546 23.0422 88.2546 24.9154C88.2546 26.7885 87.9785 28.5056 87.4261 30.0665C86.8738 31.6035 86.0813 32.9363 85.0487 34.065C84.0401 35.1696 82.8033 36.0222 81.3384 36.6225C79.8735 37.2229 78.2405 37.5231 76.4394 37.5231H66.5693ZM70.4597 34.173L70.3517 33.7768H76.2593C77.5321 33.7768 78.6608 33.5727 79.6454 33.1644C80.654 32.7562 81.4945 32.1798 82.1669 31.4354C82.8633 30.6669 83.3917 29.7303 83.7519 28.6256C84.1121 27.521 84.2922 26.2842 84.2922 24.9154C84.2922 23.5465 84.1121 22.3218 83.7519 21.2411C83.3917 20.1364 82.8633 19.1998 82.1669 18.4314C81.4705 17.6629 80.63 17.0745 79.6454 16.6663C78.6608 16.258 77.5321 16.0539 76.2593 16.0539H70.2436L70.4597 15.7297V34.173Z" fill="#374151"></path><path  d="M100.72 37.8833C98.8708 37.8833 97.2138 37.4631 95.7489 36.6225C94.308 35.758 93.1673 34.5933 92.3268 33.1284C91.4863 31.6395 91.0661 29.9464 91.0661 28.0493C91.0661 26.1521 91.4863 24.4711 92.3268 23.0062C93.1673 21.5173 94.308 20.3526 95.7489 19.512C97.2138 18.6475 98.8708 18.2152 100.72 18.2152C102.545 18.2152 104.178 18.6475 105.619 19.512C107.084 20.3526 108.237 21.5173 109.077 23.0062C109.918 24.4711 110.338 26.1521 110.338 28.0493C110.338 29.9464 109.918 31.6395 109.077 33.1284C108.237 34.5933 107.084 35.758 105.619 36.6225C104.178 37.4631 102.545 37.8833 100.72 37.8833ZM100.72 34.4972C101.849 34.4972 102.857 34.2211 103.746 33.6687C104.634 33.0924 105.331 32.3239 105.835 31.3633C106.339 30.3787 106.58 29.274 106.556 28.0493C106.58 26.8005 106.339 25.6958 105.835 24.7352C105.331 23.7506 104.634 22.9822 103.746 22.4298C102.857 21.8775 101.849 21.6013 100.72 21.6013C99.5913 21.6013 98.5707 21.8895 97.6581 22.4659C96.7696 23.0182 96.0731 23.7867 95.5688 24.7713C95.0645 25.7319 94.8244 26.8245 94.8484 28.0493C94.8244 29.274 95.0645 30.3787 95.5688 31.3633C96.0731 32.3239 96.7696 33.0924 97.6581 33.6687C98.5707 34.2211 99.5913 34.4972 100.72 34.4972Z" fill="#374151"></path><path  d="M122.054 37.8833C120.3 37.8833 118.727 37.451 117.335 36.5865C115.966 35.722 114.873 34.5453 114.057 33.0563C113.264 31.5674 112.868 29.8984 112.868 28.0493C112.868 26.2001 113.264 24.5311 114.057 23.0422C114.873 21.5533 115.966 20.3766 117.335 19.512C118.727 18.6475 120.3 18.2152 122.054 18.2152C123.735 18.2152 125.259 18.5635 126.628 19.2599C128.021 19.9323 129.078 20.8569 129.798 22.0336L127.745 24.5551C127.361 24.0028 126.868 23.4985 126.268 23.0422C125.668 22.5859 125.031 22.2257 124.359 21.9615C123.687 21.6974 123.038 21.5653 122.414 21.5653C121.261 21.5653 120.228 21.8535 119.316 22.4298C118.427 22.9822 117.719 23.7506 117.191 24.7352C116.662 25.7198 116.398 26.8245 116.398 28.0493C116.398 29.274 116.674 30.3787 117.227 31.3633C117.779 32.3239 118.511 33.0924 119.424 33.6687C120.336 34.2451 121.345 34.5333 122.45 34.5333C123.098 34.5333 123.723 34.4252 124.323 34.2091C124.947 33.9929 125.548 33.6687 126.124 33.2365C126.7 32.8042 127.241 32.2759 127.745 31.6515L129.798 34.173C129.03 35.2537 127.925 36.1422 126.484 36.8387C125.067 37.5351 123.59 37.8833 122.054 37.8833Z" fill="#374151"></path><path  d="M139.566 37.8833C138.221 37.8833 137.044 37.5711 136.036 36.9467C135.051 36.3224 134.283 35.4458 133.73 34.3171C133.202 33.1884 132.938 31.8436 132.938 30.2826V18.6115H136.648V29.274C136.648 30.3787 136.816 31.3393 137.152 32.1558C137.513 32.9483 138.017 33.5607 138.665 33.9929C139.338 34.4252 140.142 34.6413 141.079 34.6413C141.775 34.6413 142.412 34.5333 142.988 34.3171C143.564 34.077 144.057 33.7528 144.465 33.3445C144.897 32.9363 145.233 32.444 145.473 31.8676C145.714 31.2913 145.834 30.6669 145.834 29.9945V18.6115H149.544V37.5231H145.834V33.5607L146.482 33.1284C146.194 34.0169 145.702 34.8214 145.005 35.5419C144.333 36.2623 143.528 36.8387 142.592 37.2709C141.655 37.6792 140.647 37.8833 139.566 37.8833Z" fill="#374151"></path><path  d="M154.316 37.5231V18.6115H158.062V22.646L157.378 23.0782C157.57 22.4538 157.87 21.8535 158.278 21.2771C158.71 20.7008 159.227 20.1965 159.827 19.7642C160.452 19.3079 161.112 18.9477 161.808 18.6835C162.529 18.4194 163.261 18.2873 164.006 18.2873C165.086 18.2873 166.035 18.4674 166.851 18.8276C167.668 19.1878 168.34 19.7282 168.869 20.4486C169.397 21.1691 169.781 22.0696 170.021 23.1503L169.445 23.0062L169.697 22.3938C169.961 21.8415 170.322 21.3252 170.778 20.8449C171.258 20.3405 171.799 19.8963 172.399 19.512C172.999 19.1278 173.636 18.8276 174.308 18.6115C174.98 18.3954 175.641 18.2873 176.289 18.2873C177.706 18.2873 178.871 18.5755 179.783 19.1518C180.72 19.7282 181.416 20.6047 181.873 21.7814C182.353 22.9582 182.593 24.4231 182.593 26.1761V37.5231H178.847V26.3923C178.847 25.3116 178.703 24.4351 178.415 23.7626C178.15 23.0662 177.742 22.5499 177.19 22.2137C176.637 21.8775 175.929 21.7094 175.065 21.7094C174.392 21.7094 173.756 21.8295 173.155 22.0696C172.579 22.2857 172.075 22.5979 171.642 23.0062C171.21 23.4144 170.874 23.8947 170.634 24.4471C170.394 24.9754 170.274 25.5638 170.274 26.2121V37.5231H166.527V26.3202C166.527 25.3356 166.383 24.5071 166.095 23.8347C165.807 23.1383 165.387 22.6099 164.834 22.2497C164.282 21.8895 163.609 21.7094 162.817 21.7094C162.145 21.7094 161.52 21.8295 160.944 22.0696C160.368 22.2857 159.863 22.5979 159.431 23.0062C158.999 23.3904 158.662 23.8587 158.422 24.411C158.182 24.9394 158.062 25.5157 158.062 26.1401V37.5231H154.316Z" fill="#374151"></path><path  d="M194.477 37.8833C192.916 37.8833 191.487 37.451 190.19 36.5865C188.917 35.722 187.897 34.5453 187.128 33.0563C186.36 31.5674 185.976 29.8864 185.976 28.0133C185.976 26.1161 186.36 24.4351 187.128 22.9702C187.921 21.4812 188.977 20.3165 190.298 19.476C191.643 18.6355 193.144 18.2152 194.801 18.2152C195.786 18.2152 196.686 18.3593 197.503 18.6475C198.319 18.9357 199.028 19.3439 199.628 19.8723C200.252 20.3766 200.757 20.9649 201.141 21.6373C201.549 22.3098 201.801 23.0302 201.897 23.7987L201.069 23.5105V18.6115H204.815V37.5231H201.069V33.0203L201.933 32.7682C201.789 33.4166 201.489 34.053 201.033 34.6773C200.601 35.2777 200.036 35.818 199.34 36.2983C198.667 36.7786 197.911 37.1629 197.07 37.451C196.254 37.7392 195.389 37.8833 194.477 37.8833ZM195.449 34.4612C196.578 34.4612 197.575 34.185 198.439 33.6327C199.304 33.0804 199.976 32.3239 200.456 31.3633C200.961 30.3787 201.213 29.262 201.213 28.0133C201.213 26.7885 200.961 25.6958 200.456 24.7352C199.976 23.7747 199.304 23.0182 198.439 22.4659C197.575 21.9135 196.578 21.6373 195.449 21.6373C194.345 21.6373 193.36 21.9135 192.496 22.4659C191.655 23.0182 190.983 23.7747 190.478 24.7352C189.998 25.6958 189.758 26.7885 189.758 28.0133C189.758 29.262 189.998 30.3787 190.478 31.3633C190.983 32.3239 191.655 33.0804 192.496 33.6327C193.36 34.185 194.345 34.4612 195.449 34.4612Z" fill="#374151"></path><path  d="M211.977 37.5231V13.7845H215.687V37.5231H211.977ZM208.05 22.2137V18.6115H220.082V22.2137H208.05Z" fill="#374151"></path><path  d="M231.75 37.8833C229.804 37.8833 228.075 37.4751 226.562 36.6586C225.073 35.818 223.897 34.6773 223.032 33.2365C222.192 31.7956 221.771 30.1386 221.771 28.2654C221.771 26.7765 222.012 25.4197 222.492 24.1949C222.972 22.9702 223.633 21.9135 224.473 21.025C225.338 20.1124 226.358 19.416 227.535 18.9357C228.736 18.4314 230.032 18.1792 231.425 18.1792C232.65 18.1792 233.791 18.4194 234.847 18.8997C235.904 19.3559 236.817 19.9923 237.585 20.8088C238.378 21.6253 238.978 22.5979 239.386 23.7266C239.818 24.8313 240.023 26.044 239.999 27.3649L239.963 28.9498H224.509L223.681 25.996H236.757L236.216 26.6084V25.7439C236.144 24.9514 235.88 24.2429 235.424 23.6186C234.967 22.9942 234.391 22.5019 233.695 22.1417C232.998 21.7814 232.242 21.6013 231.425 21.6013C230.129 21.6013 229.036 21.8535 228.147 22.3578C227.259 22.8381 226.586 23.5585 226.13 24.5191C225.674 25.4557 225.446 26.6204 225.446 28.0133C225.446 29.3341 225.722 30.4868 226.274 31.4714C226.827 32.432 227.607 33.1764 228.616 33.7047C229.624 34.2331 230.789 34.4972 232.11 34.4972C233.046 34.4972 233.911 34.3411 234.703 34.0289C235.52 33.7168 236.396 33.1524 237.333 32.3359L239.206 34.9655C238.63 35.5419 237.921 36.0462 237.081 36.4785C236.264 36.9107 235.388 37.2589 234.451 37.5231C233.539 37.7632 232.638 37.8833 231.75 37.8833Z" fill="#374151"></path></svg></a></div>`;
  }

  function hideDialog() {
    const mask = document.querySelector('.documate-dialog');
    if(mask) {
      document.body.removeChild(mask);
    }
  }

  function askQuestion(question) {
    const questionList = document.querySelector('.question-anwser-section');
    if(questionList) {
      const li = document.createElement('li');
      li.className = 'question-anwser-item';
      li.innerHTML = `<div class="question-role-user">
        <svg  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="question-role-icon"><path  stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>${question}</div>
      `;
      const loading = document.querySelector('.documate-dialog .loading');
      if(loading) {
        questionList.insertBefore(li, loading.parentElement);
        questionList.scrollTop = questionList.scrollHeight;
      }
    }
  }

  function aiAnwser(anwser, item) {
    const questionList = document.querySelector('.question-anwser-section');
    if(questionList) {
      let li = item;
      if(!item) {
        li = document.createElement('li');
      }
      li.className = 'question-anwser-item';
      // eslint-disable-next-line no-undef
      li.innerHTML = `<div class="anwser-content"><svg class="question-role-icon documate-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.79938 23.5375C3.57959 23.516 3.36074 23.4856 3.14338 23.4465C2.98375 23.4179 2.83446 23.3477 2.71056 23.243C2.58666 23.1384 2.49252 23.0029 2.43762 22.8503C2.38272 22.6977 2.36899 22.5334 2.39782 22.3738C2.42665 22.2142 2.49702 22.065 2.60185 21.9412C3.10678 21.346 3.45159 20.6318 3.60369 19.8662C3.632 19.7246 3.57661 19.476 3.29108 19.1978C1.26031 17.2225 0 14.5431 0 11.5769C0 5.38615 5.44985 0.5 12 0.5C18.5502 0.5 24 5.38615 24 11.5769C24 17.7677 18.5502 22.6538 12 22.6538C10.9748 22.6538 9.97785 22.5345 9.02523 22.3105C7.46812 23.289 5.62931 23.7208 3.79938 23.5375ZM12.7957 18.2748C12.7504 18.3232 12.6907 18.3474 12.6165 18.3474C12.5423 18.3474 12.4805 18.3232 12.431 18.2748C12.3857 18.2305 12.3569 18.1721 12.3445 18.0995C12.258 17.4628 12.1632 16.9288 12.0602 16.4976C11.9571 16.0664 11.8212 15.7158 11.6522 15.4457C11.4832 15.1717 11.2587 14.9541 10.9784 14.7929C10.7023 14.6317 10.3459 14.5028 9.90907 14.4061C9.47225 14.3053 8.93448 14.2146 8.29574 14.134C8.21745 14.1259 8.15357 14.0977 8.10412 14.0494C8.05467 14.001 8.02995 13.9406 8.02995 13.868C8.02995 13.7955 8.05467 13.7351 8.10412 13.6867C8.15357 13.6383 8.21745 13.6101 8.29574 13.602C8.9386 13.5335 9.47844 13.4549 9.91525 13.3663C10.3521 13.2736 10.7106 13.1447 10.9908 12.9794C11.271 12.8142 11.4956 12.5925 11.6646 12.3145C11.8376 12.0364 11.9736 11.6798 12.0725 11.2445C12.1756 10.8093 12.2662 10.2713 12.3445 9.63052C12.3569 9.56201 12.3857 9.50559 12.431 9.46126C12.4805 9.4129 12.5423 9.38872 12.6165 9.38872C12.6907 9.38872 12.7504 9.4129 12.7957 9.46126C12.8452 9.50559 12.8761 9.56201 12.8885 9.63052C12.9709 10.2713 13.0615 10.8093 13.1604 11.2445C13.2635 11.6798 13.3994 12.0364 13.5684 12.3145C13.7374 12.5925 13.962 12.8142 14.2422 12.9794C14.5224 13.1447 14.8809 13.2736 15.3178 13.3663C15.7586 13.4549 16.2985 13.5335 16.9372 13.602C17.0155 13.6101 17.0773 13.6383 17.1226 13.6867C17.1721 13.7351 17.1968 13.7955 17.1968 13.868C17.1968 13.9406 17.1721 14.001 17.1226 14.0494C17.0773 14.0977 17.0155 14.1259 16.9372 14.134C16.2985 14.2025 15.7586 14.2831 15.3178 14.3758C14.8809 14.4645 14.5224 14.5914 14.2422 14.7567C13.962 14.9219 13.7374 15.1435 13.5684 15.4216C13.3994 15.6997 13.2635 16.0563 13.1604 16.4915C13.0615 16.9268 12.9709 17.4628 12.8885 18.0995C12.8761 18.1721 12.8452 18.2305 12.7957 18.2748ZM8.77789 11.9578C8.74492 11.9901 8.70371 12.0062 8.65425 12.0062C8.54711 12.0062 8.4853 11.9498 8.46882 11.8369C8.42349 11.4541 8.37404 11.1559 8.32047 10.9423C8.2669 10.7247 8.18448 10.5614 8.07322 10.4526C7.96195 10.3438 7.79094 10.2612 7.56017 10.2048C7.33351 10.1484 7.02239 10.0859 6.62679 10.0174C6.50316 10.0013 6.44135 9.94284 6.44135 9.84209C6.44135 9.74538 6.49492 9.68694 6.60206 9.66679C7.00591 9.59425 7.32115 9.52977 7.5478 9.47335C7.77857 9.4129 7.95164 9.33029 8.06703 9.2255C8.18242 9.1167 8.2669 8.95549 8.32047 8.74191C8.37404 8.52832 8.42349 8.23212 8.46882 7.8533C8.4853 7.74046 8.54711 7.68404 8.65425 7.68404C8.7614 7.68404 8.82116 7.73845 8.83352 7.84725C8.88709 8.23413 8.94066 8.53839 8.99423 8.76004C9.0478 8.97766 9.13022 9.14289 9.24149 9.25573C9.35687 9.36454 9.52788 9.44716 9.75454 9.50358C9.9853 9.55596 10.3026 9.61037 10.7065 9.66679C10.7518 9.67485 10.7889 9.695 10.8177 9.72724C10.8507 9.75545 10.8672 9.79373 10.8672 9.84209C10.8672 9.94284 10.8136 10.0013 10.7065 10.0174C10.3026 10.094 9.98736 10.1625 9.76072 10.2229C9.53406 10.2834 9.36305 10.368 9.24767 10.4768C9.13228 10.5816 9.0478 10.7408 8.99423 10.9544C8.94066 11.1639 8.88709 11.4601 8.83352 11.843C8.82939 11.8873 8.81085 11.9256 8.77789 11.9578ZM11.6213 7.98024C11.6048 8.05278 11.5636 8.08905 11.4977 8.08905C11.4235 8.08905 11.3823 8.05278 11.374 7.98024C11.3163 7.67799 11.2628 7.45635 11.2133 7.3153C11.168 7.17022 11.0712 7.06746 10.9228 7.007C10.7786 6.94655 10.5354 6.88812 10.1934 6.8317C10.1192 6.81558 10.0821 6.77528 10.0821 6.7108C10.0821 6.63826 10.1192 6.59796 10.1934 6.5899C10.5354 6.52945 10.7786 6.47102 10.9228 6.4146C11.0712 6.35415 11.168 6.2534 11.2133 6.11235C11.2628 5.96727 11.3163 5.74159 11.374 5.43531C11.3823 5.36277 11.4235 5.3265 11.4977 5.3265C11.5636 5.3265 11.6048 5.36277 11.6213 5.43531C11.6749 5.74159 11.7264 5.96727 11.7758 6.11235C11.8253 6.2534 11.9221 6.35415 12.0663 6.4146C12.2106 6.47102 12.4537 6.52945 12.7957 6.5899C12.8699 6.59796 12.907 6.63826 12.907 6.7108C12.907 6.77528 12.8699 6.81558 12.7957 6.8317C12.4537 6.88812 12.2106 6.94655 12.0663 7.007C11.9221 7.06746 11.8253 7.17022 11.7758 7.3153C11.7264 7.45635 11.6749 7.67799 11.6213 7.98024Z" fill="currentColor"></path></svg><div class="markdown-body">${markdownToHtml(anwser)}</div></div>`;
      const loading = document.querySelector('.documate-dialog .loading');
      if(!item && loading) {
        questionList.insertBefore(li, loading.parentElement);
      }
      questionList.scrollTop = questionList.scrollHeight;
      return li;
    }
    return null;
  }

  const endpoint = askAI.dataset.endpoint;
  if(!endpoint) {
    throw new Error('Missing endpoint');
  }

  async function searchAI(question) {
    const loading = document.querySelector('.documate-dialog .loading');
    loading.style.display = 'block';
    if(!loading) return;
    const {body} = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
      }),
    });
    loading.style.display = 'none';
    const reader = body.getReader();
    let text = '';
    let item = null;
    do {
      // eslint-disable-next-line no-await-in-loop
      const {value, done} = await reader.read();
      if(value) text += (new TextDecoder().decode(value));
      item = aiAnwser(text, item);
      if(done) break;
    // eslint-disable-next-line no-constant-condition
    } while(1);
    // console.log(text);
  }

  document.addEventListener('click', (event) => {
    if(event.target.id === 'ask-ai') {
      event.preventDefault();
      showDialog();
    }
  });

  window.addEventListener('keydown', async (event) => {
    if(event.key === 'Escape') {
      hideDialog();
    } else if(event.metaKey && event.key === '/') {
      showDialog();
    } else if(event.key === 'Enter') {
      const input = document.querySelector('.documate-dialog input');
      if(input) {
        const value = input.value;
        if(value) {
          input.value = '';
          askQuestion(value);
          await searchAI(value);
        }
      }
    }
  });
})();