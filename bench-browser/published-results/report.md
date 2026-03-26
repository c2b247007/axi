# Browser Benchmark Results

## Summary

| Condition | Tasks | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success% |
|-----------|-------|-----------------|--------|-------------------|----------|------------|-------------|-----------|----------|
| agent-browser | 80 | 210635 | 86% | 796 | $0.1619 | $12.95 | 24.6s | 6.3 | 100% |
| pinchtab | 80 | 197451 | 80% | 978 | $0.1589 | $12.72 | 50.1s | 5.9 | 86% |
| agent-browser-axi | 80 | 155244 | 79% | 661 | $0.1479 | $11.83 | 24.5s | 4.6 | 100% |
| chrome-devtools-mcp | 80 | 251191 | 88% | 714 | $0.1719 | $13.75 | 26.1s | 5.3 | 99% |
| chrome-devtools-mcp-search | 80 | 244620 | 80% | 1076 | $0.1851 | $14.81 | 33.3s | 7.3 | 88% |
| chrome-devtools-mcp-compressed-cli | 80 | 208345 | 84% | 795 | $0.1706 | $13.64 | 28.1s | 6.2 | 100% |
| chrome-devtools-mcp-code | 80 | 289435 | 85% | 1863 | $0.2183 | $17.46 | 42.4s | 8.1 | 99% |

## Per-Task Breakdown

### read_static_page

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser | 88744 | 100% | 203 | $0.0305 | $0.1525 | 9.7s | 2.8 | 5/5 |
| pinchtab | 68994 | 91% | 152 | $0.0432 | $0.2160 | 8.3s | 2.2 | 5/5 |
| agent-browser-axi | 63155 | 70% | 149 | $0.0874 | $0.4370 | 8.9s | 2.0 | 5/5 |
| chrome-devtools-mcp | 138910 | 84% | 178 | $0.1228 | $0.6138 | 12.8s | 3.0 | 5/5 |
| chrome-devtools-mcp-search | 126659 | 81% | 334 | $0.1264 | $0.6318 | 13.8s | 4.0 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 94561 | 75% | 237 | $0.1120 | $0.5601 | 15.2s | 3.0 | 5/5 |
| chrome-devtools-mcp-code | 200476 | 81% | 803 | $0.1576 | $0.7882 | 23.7s | 6.0 | 5/5 |

### wikipedia_fact_lookup

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| pinchtab | 126003 | 81% | 386 | $0.1245 | $0.6227 | 13.7s | 4.0 | 5/5 |
| agent-browser-axi | 116285 | 79% | 439 | $0.1253 | $0.6264 | 12.8s | 3.6 | 5/5 |
| agent-browser | 115430 | 79% | 323 | $0.1223 | $0.6115 | 12.3s | 3.6 | 5/5 |
| chrome-devtools-mcp | 138286 | 84% | 296 | $0.1243 | $0.6216 | 13.7s | 3.0 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 94782 | 75% | 263 | $0.1132 | $0.5659 | 14.0s | 3.0 | 5/5 |
| chrome-devtools-mcp-search | 221199 | 88% | 1037 | $0.1741 | $0.8707 | 27.8s | 6.8 | 5/5 |
| chrome-devtools-mcp-code | 103721 | 75% | 433 | $0.1245 | $0.6227 | 14.1s | 3.2 | 5/5 |

### github_repo_stars

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser | 136966 | 81% | 476 | $0.1376 | $0.6881 | 15.3s | 4.2 | 5/5 |
| pinchtab | 128991 | 80% | 426 | $0.1350 | $0.6751 | 13.3s | 4.0 | 5/5 |
| agent-browser-axi | 118019 | 78% | 441 | $0.1310 | $0.6548 | 14.2s | 3.6 | 5/5 |
| chrome-devtools-mcp | 224183 | 89% | 743 | $0.1608 | $0.8039 | 28.4s | 4.8 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 217574 | 86% | 1015 | $0.1798 | $0.8991 | 29.5s | 6.4 | 5/5 |
| chrome-devtools-mcp-code | 210467 | 84% | 967 | $0.1870 | $0.9350 | 24.7s | 6.0 | 5/5 |
| chrome-devtools-mcp-search | 31053 | 28% | 3 | $0.0868 | $0.4341 | 13.3s | 0.0 | 0/5 |

### httpbin_page_read

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| pinchtab | 82322 | 70% | 356 | $0.1129 | $0.5645 | 17.7s | 2.6 | 5/5 |
| agent-browser-axi | 63977 | 63% | 308 | $0.1064 | $0.5319 | 8.3s | 2.0 | 5/5 |
| agent-browser | 102718 | 76% | 463 | $0.1219 | $0.6095 | 11.5s | 3.2 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 95456 | 75% | 410 | $0.1177 | $0.5887 | 15.4s | 3.0 | 5/5 |
| chrome-devtools-mcp | 139485 | 83% | 353 | $0.1285 | $0.6427 | 13.9s | 3.0 | 4/5 |
| chrome-devtools-mcp-search | 127560 | 80% | 495 | $0.1321 | $0.6605 | 17.7s | 4.0 | 4/5 |
| chrome-devtools-mcp-code | 95991 | 75% | 541 | $0.1204 | $0.6018 | 11.8s | 3.0 | 5/5 |

### wikipedia_table_read

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser-axi | 152705 | 82% | 768 | $0.1484 | $0.7422 | 18.5s | 4.6 | 5/5 |
| agent-browser | 178140 | 83% | 821 | $0.1555 | $0.7773 | 19.9s | 5.4 | 5/5 |
| pinchtab | 251248 | 88% | 1342 | $0.1881 | $0.9404 | 27.4s | 7.6 | 5/5 |
| chrome-devtools-mcp | 223562 | 89% | 895 | $0.1626 | $0.8131 | 24.3s | 4.8 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 194652 | 83% | 839 | $0.1776 | $0.8878 | 26.5s | 5.6 | 5/5 |
| chrome-devtools-mcp-search | 372181 | 92% | 2149 | $0.2400 | $1.2001 | 43.5s | 11.0 | 5/5 |
| chrome-devtools-mcp-code | 367578 | 92% | 2606 | $0.2477 | $1.2384 | 54.9s | 10.8 | 5/5 |

### wikipedia_link_follow

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser-axi | 187325 | 85% | 662 | $0.1592 | $0.7958 | 19.8s | 5.6 | 5/5 |
| agent-browser | 262404 | 89% | 1085 | $0.1930 | $0.9649 | 27.1s | 7.8 | 5/5 |
| pinchtab | 326453 | 92% | 1251 | $0.2050 | $1.0249 | 31.8s | 10.0 | 4/5 |
| chrome-devtools-mcp | 417456 | 94% | 1039 | $0.2263 | $1.1314 | 35.7s | 8.8 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 251731 | 89% | 755 | $0.1811 | $0.9056 | 29.4s | 7.6 | 5/5 |
| chrome-devtools-mcp-search | 381412 | 93% | 1613 | $0.2329 | $1.1646 | 42.7s | 11.4 | 5/5 |
| chrome-devtools-mcp-code | 352825 | 90% | 2245 | $0.2577 | $1.2884 | 53.5s | 9.4 | 5/5 |

### github_navigate_to_file

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser-axi | 131071 | 81% | 470 | $0.1343 | $0.6717 | 14.4s | 4.0 | 5/5 |
| agent-browser | 186514 | 85% | 535 | $0.1571 | $0.7853 | 17.2s | 5.6 | 5/5 |
| pinchtab | 160328 | 84% | 530 | $0.1444 | $0.7219 | 19.2s | 5.0 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 149051 | 82% | 518 | $0.1415 | $0.7075 | 23.7s | 4.6 | 5/5 |
| chrome-devtools-mcp | 168240 | 86% | 446 | $0.1367 | $0.6834 | 19.0s | 3.6 | 5/5 |
| chrome-devtools-mcp-search | 246954 | 89% | 1033 | $0.1783 | $0.8917 | 31.1s | 7.6 | 5/5 |
| chrome-devtools-mcp-code | 266624 | 89% | 1429 | $0.1970 | $0.9849 | 51.3s | 7.8 | 5/5 |

### wikipedia_infobox_hop

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser-axi | 310669 | 90% | 1238 | $0.2194 | $1.0971 | 35.6s | 9.0 | 5/5 |
| agent-browser | 448035 | 93% | 1361 | $0.2554 | $1.2771 | 46.7s | 12.8 | 5/5 |
| chrome-devtools-mcp | 310640 | 92% | 999 | $0.1923 | $0.9615 | 35.2s | 6.6 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 370951 | 92% | 1276 | $0.2339 | $1.1696 | 38.1s | 10.6 | 5/5 |
| pinchtab | 257984 | 67% | 978 | $0.1858 | $0.9292 | 155.6s | 7.2 | 3/5 |
| chrome-devtools-mcp-search | 347032 | 91% | 1735 | $0.2225 | $1.1126 | 58.8s | 10.4 | 5/5 |
| chrome-devtools-mcp-code | 299988 | 86% | 1526 | $0.2336 | $1.1679 | 38.0s | 8.0 | 5/5 |

### multi_page_comparison

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser-axi | 217738 | 88% | 833 | $0.1684 | $0.8422 | 25.4s | 6.6 | 5/5 |
| agent-browser | 290070 | 90% | 1103 | $0.1979 | $0.9893 | 43.2s | 8.6 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 250628 | 89% | 755 | $0.1795 | $0.8977 | 40.6s | 7.6 | 5/5 |
| chrome-devtools-mcp | 369061 | 92% | 1027 | $0.2086 | $1.0432 | 49.3s | 7.8 | 5/5 |
| chrome-devtools-mcp-search | 363562 | 93% | 1676 | $0.2278 | $1.1392 | 52.8s | 11.0 | 5/5 |
| pinchtab | 274654 | 89% | 1205 | $0.1912 | $0.9558 | 30.9s | 8.4 | 5/5 |
| chrome-devtools-mcp-code | 488474 | 91% | 3348 | $0.3020 | $1.5100 | 65.8s | 13.4 | 5/5 |

### wikipedia_search_click

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser-axi | 209095 | 75% | 614 | $0.1686 | $0.8428 | 93.7s | 5.8 | 5/5 |
| agent-browser | 210135 | 88% | 669 | $0.1630 | $0.8149 | 22.6s | 6.4 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 302622 | 91% | 973 | $0.1998 | $0.9991 | 40.6s | 9.2 | 5/5 |
| chrome-devtools-mcp | 410271 | 94% | 791 | $0.2227 | $1.1133 | 35.6s | 8.6 | 5/5 |
| chrome-devtools-mcp-search | 289420 | 79% | 1206 | $0.1962 | $0.9812 | 35.9s | 8.4 | 4/5 |
| chrome-devtools-mcp-code | 403212 | 89% | 2309 | $0.2932 | $1.4658 | 56.6s | 10.4 | 4/5 |
| pinchtab | 76897 | 40% | 214 | $0.1061 | $0.5306 | 247.1s | 1.6 | 0/5 |

### wikipedia_deep_extraction

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser | 245817 | 87% | 1135 | $0.1879 | $0.9397 | 41.0s | 7.2 | 5/5 |
| agent-browser-axi | 222434 | 87% | 1196 | $0.1873 | $0.9365 | 35.9s | 6.4 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 245045 | 86% | 1201 | $0.2102 | $1.0508 | 33.3s | 6.6 | 5/5 |
| chrome-devtools-mcp | 216458 | 88% | 1211 | $0.1662 | $0.8312 | 29.1s | 4.6 | 5/5 |
| chrome-devtools-mcp-search | 234236 | 87% | 1133 | $0.1889 | $0.9445 | 29.0s | 7.0 | 5/5 |
| chrome-devtools-mcp-code | 421259 | 89% | 3377 | $0.2952 | $1.4760 | 64.1s | 11.6 | 5/5 |
| pinchtab | 330767 | 88% | 2211 | $0.2429 | $1.2143 | 77.7s | 9.6 | 5/5 |

### github_issue_investigation

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser | 180662 | 83% | 952 | $0.1670 | $0.8349 | 23.1s | 5.4 | 5/5 |
| agent-browser-axi | 119780 | 72% | 593 | $0.1581 | $0.7907 | 18.5s | 3.4 | 5/5 |
| chrome-devtools-mcp | 156944 | 74% | 398 | $0.1912 | $0.9561 | 19.1s | 3.0 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 173611 | 82% | 809 | $0.1696 | $0.8482 | 26.4s | 5.2 | 5/5 |
| chrome-devtools-mcp-search | 144852 | 72% | 569 | $0.1938 | $0.9692 | 22.2s | 4.0 | 5/5 |
| chrome-devtools-mcp-code | 328312 | 84% | 2258 | $0.2403 | $1.2014 | 53.2s | 9.2 | 5/5 |
| pinchtab | 241326 | 88% | 1836 | $0.1950 | $0.9748 | 39.8s | 7.2 | 5/5 |

### multi_site_research

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser | 402715 | 92% | 1371 | $0.2411 | $1.2057 | 36.1s | 11.8 | 5/5 |
| agent-browser-axi | 215983 | 87% | 1025 | $0.1769 | $0.8847 | 27.9s | 6.6 | 5/5 |
| chrome-devtools-mcp | 545969 | 95% | 1613 | $0.2756 | $1.3779 | 47.4s | 11.4 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 399486 | 92% | 1519 | $0.2529 | $1.2647 | 44.2s | 11.6 | 5/5 |
| chrome-devtools-mcp-search | 558291 | 95% | 2381 | $0.3080 | $1.5399 | 68.7s | 17.4 | 5/5 |
| chrome-devtools-mcp-code | 505356 | 92% | 3525 | $0.3165 | $1.5823 | 72.1s | 13.4 | 5/5 |
| pinchtab | 256872 | 73% | 1144 | $0.1670 | $0.8350 | 29.4s | 8.2 | 3/5 |

### tabular_data_analysis

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser-axi | 164547 | 82% | 1019 | $0.1626 | $0.8131 | 32.4s | 4.8 | 5/5 |
| agent-browser | 253459 | 88% | 1239 | $0.1979 | $0.9896 | 36.4s | 7.4 | 5/5 |
| chrome-devtools-mcp | 139654 | 84% | 465 | $0.1282 | $0.6409 | 14.8s | 3.0 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 174980 | 81% | 899 | $0.1790 | $0.8952 | 28.0s | 5.0 | 5/5 |
| chrome-devtools-mcp-search | 200828 | 82% | 858 | $0.1945 | $0.9725 | 24.1s | 6.0 | 5/5 |
| chrome-devtools-mcp-code | 230994 | 85% | 1784 | $0.1995 | $0.9976 | 40.1s | 6.8 | 5/5 |
| pinchtab | 310466 | 87% | 2556 | $0.2396 | $1.1981 | 56.7s | 8.8 | 5/5 |

### navigate_404

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser-axi | 95874 | 75% | 387 | $0.1180 | $0.5898 | 13.7s | 3.0 | 5/5 |
| agent-browser | 128054 | 81% | 434 | $0.1292 | $0.6460 | 14.1s | 4.0 | 5/5 |
| chrome-devtools-mcp | 233434 | 90% | 490 | $0.1607 | $0.8033 | 20.7s | 5.0 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 159559 | 85% | 579 | $0.1412 | $0.7059 | 22.1s | 5.0 | 5/5 |
| chrome-devtools-mcp-search | 95417 | 51% | 250 | $0.1129 | $0.5646 | 25.9s | 2.4 | 2/5 |
| chrome-devtools-mcp-code | 96298 | 75% | 673 | $0.1233 | $0.6166 | 15.9s | 3.0 | 5/5 |
| pinchtab | 140141 | 82% | 517 | $0.1356 | $0.6781 | 18.7s | 4.6 | 4/5 |

### broken_element_interaction

| Condition | Avg Input Tokens | Cache% | Avg Output Tokens | Avg Cost | Total Cost | Avg Duration | Avg Turns | Success |
|-----------|-----------------|--------|-------------------|----------|------------|-------------|-----------|---------|
| agent-browser-axi | 95249 | 75% | 430 | $0.1157 | $0.5784 | 11.8s | 3.0 | 5/5 |
| agent-browser | 140294 | 83% | 574 | $0.1325 | $0.6627 | 16.8s | 4.4 | 5/5 |
| chrome-devtools-mcp | 186510 | 88% | 471 | $0.1422 | $0.7109 | 18.2s | 4.0 | 5/5 |
| chrome-devtools-mcp-compressed-cli | 158834 | 85% | 669 | $0.1397 | $0.6983 | 22.1s | 5.0 | 5/5 |
| chrome-devtools-mcp-search | 173260 | 86% | 748 | $0.1466 | $0.7329 | 25.3s | 5.4 | 5/5 |
| chrome-devtools-mcp-code | 259379 | 87% | 1988 | $0.1974 | $0.9870 | 38.3s | 7.8 | 5/5 |
| pinchtab | 125762 | 81% | 550 | $0.1268 | $0.6341 | 14.4s | 4.0 | 5/5 |

