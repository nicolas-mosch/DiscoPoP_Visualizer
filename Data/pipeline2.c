//
//  19_simple_pipeline_2.c
//
//
//  Created by Zia Ul-Huda on 2/4/2013.
//
//

#include <stdio.h>

int foo(int in, int d){
    return in * d;
}

int bar(int in, int d){
    return in + d;
}

int delta(int in, int d){
    return in -d;
}

int main( void)
{
    int a,b,c,i;
    int d = 20;
    for (i=0; i<100; i++) {
        a = foo(i, d);
        b = bar(a, d);
        c = delta(b, d);
        printf("%d\n", c);
    }
    return 0;
}
