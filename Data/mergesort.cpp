#include <cmath>
#include <iostream>
#include <climits>

using namespace std;

void merge(int A[], int p, int q, int r){
  int n1 = q - p + 1;
  int n2 = r - q;
  int L[n1 + 1];
  int R[n2 + 1];
  int i = 0;
  int j = 0;
  for(; i < n1; i++){
    L[i] = A[p + i];
  }
  for(; j < n2; j++){
    R[j] = A[q + j + 1];
  }
  L[n1] = INT_MAX;
  R[n2] = INT_MAX;

  for(int i = 0; i <= n2; i++){
    cout << R[i] << " ";
  }
  cout << endl;

  i = 0; j = 0;
  for(int k = p; k <= r; k++){
    if(L[i] <= R[j]){
      A[k] = L[i];
      i++;
    }else{
      A[k] = R[j];
      j++;
    }
  }
}

void mergeSort(int A[], int p, int r){
  for(int i = 0; i < 10; i++){
    cout << A[i] << " ";
  }
  cout << endl;
  if(p < r){
    int q = floor((p+r)/2);
    mergeSort(A, p, q);
    mergeSort(A, q + 1, r);
    merge(A, p, q, r);
  }
}

int main(){
  int r = 0;
  int array[10] = {1, 0, 5, 8, 4, 2, 7, 1, 3, 2};
  mergeSort(array, 0, 9);
  for(int i = 0; i < 10; i++){
    cout << array[i] << " ";
  }
  cin >> r;
  return r;
}
