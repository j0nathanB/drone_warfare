guiding principle is data visualization of a serious topic
    accessible - easy-to-use and a11y
    professional - serious topic, treat with respect
    do just enough, nothing fancy

- Breadcrumb/dropdown in top bar
    Global --- Country --- Adm1 --- Adm2 (--- Adm3 )
                Afghanistan     (all Adm1)      (all Adm2)      (all Adm3)
                Pakistan
                Somalia
                Yemen
    - Selecting an element from a dropdown auto-filters the other elements in their dropdowns
        - e.g. selecting Afghanistan will automatically filter the available adm1, adm2, adm3
            - in this case, adm1 will only correspond to Afghanistan. adm2 will have all the adm2 available to afghanistan, until an adm1 is selected, then adm2 will be filtered according to adm1. adm3 will be grayed out.
    - Adm3 is by default grayed out until an adm2 is selected under Pakistan
    - Existing breadcrumb behavior remains

- Data Layers to Layers, e.g.
    Layers
        Heat map
        Bubble map
        Boundaries (checkboxes)
            Country
            Adm1
            Adm2
            (Adm3 - grayed out)

Compare
    Administrations
    Countries
    Years

Sidebar
*Afghanistan*
***Civilian casualties***
Deadliest year        2005                   
Total               X
Children            Y
Injured             Z


Deadliest location for civilians
(ihcl. children)

(Data table)
    animate expanding out to full size
    sortable
